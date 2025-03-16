"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useAuthRedirect } from '@/components/AuthContext';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUpload } from "@/components/FileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import MultiSelect from '@/components/MultiSelect';
import LocationSearch from '@/components/LocationSearch';
import { jsPDF } from 'jspdf';


export default function FormPage() {
  const { slug } = useParams();
  const router = useRouter();
  const { token, user, isAuthLoaded } = useAuth();
  useAuthRedirect();

  const [formData, setFormData] = useState({});
  const [submissionStatus, setSubmissionStatus] = useState('draft');
  const [formConfig, setFormConfig] = useState(null);
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [isFirstSubmit, setIsFirstSubmit] = useState(true);

  // Form dapat diedit jika statusnya 'draft', null, atau 'submitted'
  const isEditable = submissionStatus === 'draft' || submissionStatus === 'submitted' || submissionStatus === null;

  useEffect(() => {
    if (!slug || !token) return;

    const fetchForm = async () => {
      try {
        setIsLoadingForm(true);
        const res = await fetch(`https://dev.dokasah.web.id/api/forms/${slug}`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Form tidak ditemukan');
        }

        const data = await res.json();
        const loadedConfig = {
          ...data.form,
          title: data.form.form_structure.title,
          fields: data.form.form_structure?.fields || []
        };

        // Jika ada field multi-select dengan options_url, load opsi KBLI
        const updatedFields = await Promise.all(
          loadedConfig.fields.map(async (field) => {
            if (field.type === 'multi-select' && field.options_url) {
              const res = await fetch(field.options_url);
              const json = await res.json();
              field.options = (json.data || json).map(item => ({
                value: item.Kode,
                label: `${item.Kode} - ${item.Judul}`
              }));
            }
            return field;
          })
        );
        loadedConfig.fields = updatedFields;

        setFormConfig(loadedConfig);
        setFormData(data.submission?.data || {});
        setSubmissionStatus(data.submission?.status || 'draft');
      } catch (error) {
        setErrorMessage(error.message);
      } finally {
        setIsLoadingForm(false);
      }
    };

    fetchForm();
  }, [slug, token]);


// Helper untuk load, mengkompres, dan mengubah ukuran gambar
const loadImageWithDimensions = (url, scaleFactor = 0.5, quality = 0.7) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      // Ubah ukuran gambar berdasarkan scale factor
      canvas.width = img.width * scaleFactor;
      canvas.height = img.height * scaleFactor;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // Konversi ke JPEG dengan kualitas yang diatur (0 sampai 1)
      const dataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve({ dataUrl, width: canvas.width, height: canvas.height });
    };
    img.onerror = () => reject(new Error('Could not load image'));
    img.src = url;
  });
};

// Tambahkan fungsi untuk menambah item grup
const addGroupItem = (groupFieldName, groupFields) => {
  const newItem = {};
  groupFields.forEach(subField => {
    newItem[subField.name] = '';
  });
  setFormData(prev => ({
    ...prev,
    [groupFieldName]: [...(prev[groupFieldName] || []), newItem]
  }));
};

// Fungsi untuk menghapus item grup
const removeGroupItem = (groupFieldName, index) => {
  const groupValues = formData[groupFieldName] || [];
  groupValues.splice(index, 1);
  setFormData(prev => ({
    ...prev,
    [groupFieldName]: [...groupValues]
  }));
};

const uploadFileForRepeat = async (groupFieldName, index, subFieldName, file) => {
  try {
    // Membuat nama file unik dengan menambahkan indeks (_1, _2, dst)
    const uniqueFileName = `${groupFieldName}_${subFieldName}_${index + 1}`;
    const filePath = await uploadFile(uniqueFileName, file);
    const groupValues = formData[groupFieldName] || [];
    groupValues[index][subFieldName] = filePath;
    setFormData(prev => ({
      ...prev,
      [groupFieldName]: [...groupValues]
    }));
  } catch (error) {
    console.error('Error saat upload file untuk pengurus:', error);
  }
};



const generatePDF = async () => {
  if (!formConfig) return;
  const doc = new jsPDF();

  // Margin disesuaikan agar konten tidak menimpa area header & footer pada template
  const leftMargin = 20, rightMargin = 20, topMargin = 60, bottomMargin = 30;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const effectiveWidth = pageWidth - leftMargin - rightMargin;
  let y = topMargin;

  // URL template PNG full A4
  const templateUrl = "https://file.ccgnimex.my.id/file/ccgnimex/dokasah/berkas/Branding%20Dokasah/surat-2.png";

  // Fungsi untuk load, mengkompres, dan mengubah gambar ke Base64
  // Tambahan parameter quality (default 0.7), template cover bisa pakai quality 0.9
  const compressImage = async (imageUrl, maxWidth = 1080, quality = 0.9) => {
    try {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.src = imageUrl;
      return new Promise((resolve) => {
        img.onload = () => {
          let width = img.width;
          let height = img.height;
          if (width > maxWidth) {
            const scaleFactor = maxWidth / width;
            width = maxWidth;
            height = height * scaleFactor;
          }
          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, width, height);
          resolve({ dataUrl: canvas.toDataURL("image/jpeg", quality), width: img.width, height: img.height });
        };
      });
    } catch (error) {
      console.error("Gagal memproses gambar:", error);
      return null;
    }
  };

  // Kompres template cover dengan kualitas 0.9 agar file size tidak bengkak tapi tetap tajam
  const templateImageObj = await compressImage(templateUrl, 1080, 1.0);
  const templateImage = templateImageObj ? templateImageObj.dataUrl : null;

  // Fungsi untuk menambahkan template sebagai latar belakang di halaman saat ini
  const addTemplate = () => {
    if (templateImage) {
      // Gambar template akan memenuhi seluruh halaman
      doc.addImage(templateImage, "JPEG", 0, 0, pageWidth, pageHeight);
    }
  };

  // Tambahkan template ke halaman pertama
  addTemplate();

  // **Judul Form**
  doc.setFontSize(16);
  const titleLines = doc.splitTextToSize(formConfig.title, effectiveWidth);
  titleLines.forEach((line) => {
    if (y > pageHeight - bottomMargin) {
      doc.addPage();
      addTemplate();
      y = topMargin;
    }
    doc.text(line, leftMargin, y);
    y += 10;
  });
  y += 5;

  // Faktor konversi pixel ke mm (A4: 595px -> 210mm)
  const pxToMm = pageWidth / 595;

  // **Isi Form**
  doc.setFontSize(12);
  for (const field of formConfig.fields) {
    let value = formData[field.name] || '';

    // Jika field adalah array (contoh: Pengurus)
    if (Array.isArray(value)) {
      doc.text(`${field.label}:`, leftMargin, y);
      y += 5;
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          for (const [key, val] of Object.entries(item)) {
            if (typeof val === "string" && val.match(/\.(jpeg|jpg|png|gif)$/i)) {
              // Untuk field foto, sisipkan link "klik disini" dengan target new tab
              const labelText = `- ${key}: `;
              doc.text(labelText + "klik disini", leftMargin, y);
              doc.textWithLink(
                "klik disini",
                leftMargin + doc.getTextWidth(labelText),
                y,
                { url: val, target: '_blank' }
              );
              y += 10;
            } else {
              doc.text(`- ${key}: ${val}`, leftMargin, y);
              y += 5;
            }
          }
        } else {
          doc.text(`- ${item}`, leftMargin + 5, y);
          y += 5;
        }
      }
      y += 5;
      continue;
    }

    // Jika Field adalah Gambar (non-array)
    if (typeof value === "string" && value.match(/\.(jpeg|jpg|gif|png)$/i)) {
      const labelText = `${field.label}: `;
      doc.text(labelText + "klik disini", leftMargin, y);
      doc.textWithLink(
        "klik disini",
        leftMargin + doc.getTextWidth(labelText),
        y,
        { url: value, target: '_blank' }
      );
      y += 10;
      continue;
    }

    // Default: Teks Normal
    const text = `${field.label}: ${value}`;
    const textLines = doc.splitTextToSize(text, effectiveWidth);
    textLines.forEach((line) => {
      if (y > pageHeight - bottomMargin) {
        doc.addPage();
        addTemplate();
        y = topMargin;
      }
      doc.text(line, leftMargin, y);
      y += 10;
    });
  }

  // Simpan PDF
  doc.save(`${formConfig.title}.pdf`);
};




  

  // Fungsi upload file ke backend
  const uploadFile = async (fieldName, file) => {
    const formPayload = new FormData();
    formPayload.append('slug', slug);
    formPayload.append('fieldName', fieldName);
    formPayload.append('file', file);

    try {
      const res = await fetch(`https://dev.dokasah.web.id/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formPayload,
      });

      const contentType = res.headers.get("content-type") || "";
      
      if (!res.ok) {
        let errorMessage = 'Gagal mengupload file';
        if (contentType.includes("application/json")) {
          const errorData = await res.json();
          errorMessage = errorData.message || errorMessage;
        } else {
          const errorText = await res.text();
          errorMessage = errorText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      if (contentType.includes("application/json")) {
        const data = await res.json();
        return data.fileUrl;
      } else {
        const text = await res.text();
        throw new Error(`Respons tidak valid JSON: ${text}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      throw error;
    }
  };

  const handleFileChange = async (name, file) => {
    try {
      const filePath = await uploadFile(name, file);
      setFormData(prev => ({ ...prev, [name]: filePath }));
    } catch (error) {
      console.error('Error saat upload file:', error);
    }
  };

  // Simpan draft otomatis
  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const res = await fetch(`https://dev.dokasah.web.id/api/forms/${slug}/draft`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ data: formData })
      });

      if (!res.ok) throw new Error('Gagal menyimpan draft');
    } catch (error) {
      console.error('Error saving draft:', error);
    } finally {
      setIsSavingDraft(false);
    }
  };

  useEffect(() => {
    if (Object.keys(formData).length > 0 && submissionStatus === 'draft') {
      const timeoutId = setTimeout(() => {
        saveDraft();
      }, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [formData]);

  const handleEdit = async () => {
    try {
      const res = await fetch(`https://dev.dokasah.web.id/api/forms/${slug}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'draft' })
      });
      if (res.ok) {
        setSubmissionStatus('draft');
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Gagal mengaktifkan edit:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`https://dev.dokasah.web.id/api/forms/${slug}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: formData }),
      });
      if (res.ok) {
        setSubmissionStatus("submitted");
        setIsEditing(false);
        if (isFirstSubmit) {
          setShowPopup(true);
          setIsFirstSubmit(false);
        }
      }
    } catch (error) {
      console.error("Submission error:", error);
    }
  };

  // Callback untuk update lokasi dari API pos
  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      desa_kelurahan: location.village,
      kecamatan: location.district,
      kabupaten_kota: location.regency,
      provinsi: location.province,
      kode_pos: location.code, // Asumsi 'code' adalah kode pos
    }));
  };

  if (!user || !isAuthLoaded || isLoadingForm) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-sm text-red-500">{errorMessage}</p>
        <Button onClick={() => router.push("/dashboard")}>Kembali</Button>
      </div>
    );
  }

  if (!formConfig || !Array.isArray(formConfig.fields)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Memuat formulir...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <Card>
        <CardContent className="flex items-center justify-between p-4">
          <h1 className="text-xl sm:text-2xl font-bold">{formConfig.title}</h1>
          {submissionStatus === 'submitted' && !isEditing && isEditable && (
            <button
              type="button"
              onClick={handleEdit}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Edit Form"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
        </CardContent>
      </Card>

      {/* Jika formulir tidak dapat diedit, tampilkan widget keterangan */}
      {!isEditable && (
        <div className="p-4 bg-yellow-100 text-yellow-800 rounded-md">
          Formulir tidak bisa diubah, karena sudah dalam proses pengerjaan oleh tim kami
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {formConfig.fields.map((field) => {
          // Gunakan LocationSearch untuk field desa_kelurahan
          if (field.name === "desa_kelurahan") {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <LocationSearch onSelect={handleLocationSelect} />
              </div>
            );
          }
          // Untuk field lokasi lainnya, tampilkan input non-editable
          if (
            field.name === "kecamatan" ||
            field.name === "kabupaten_kota" ||
            field.name === "provinsi" ||
            field.name === "kode_pos"
          ) {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type={field.name === "kode_pos" ? "number" : "text"}
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full"
                  disabled
                />
              </div>
            );
          }
          // Render field lain sesuai tipe-nya
          if (field.type === 'text') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="text"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full"
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
              </div>
            );
          }
          if (field.type === 'textarea') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Textarea
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full"
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
              </div>
            );
          }
          if (field.type === 'repeat') {
            const groupValues = formData[field.name] || [];
            return (
              <div key={field.name} className="border p-4 rounded mb-4">
                <label className="block mb-2 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                {groupValues.map((groupItem, index) => (
                  <div key={index} className="border p-3 rounded mb-3">
                    {field.fields.map((subField) => {
                      const subFieldKey = `${field.name}-${index}-${subField.name}`;
                      const value = groupItem[subField.name] || '';
                      if (subField.type === 'text') {
                        return (
                          <div key={subFieldKey} className="mb-2">
                            <label className="block mb-1 text-sm font-medium">
                              {subField.label} {subField.required && <span className="text-red-500">*</span>}
                            </label>
                            <Input
                              type="text"
                              value={value}
                              onChange={(e) => {
                                const newGroupValues = [...groupValues];
                                newGroupValues[index][subField.name] = e.target.value;
                                setFormData({ ...formData, [field.name]: newGroupValues });
                              }}
                              required={subField.required}
                              className="w-full"
                              disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                            />
                          </div>
                        );
                      }
                      if (subField.type === 'file') {
                        return (
                          <div key={subFieldKey} className="mb-2 space-y-2">
                            <label className="block mb-1 text-sm font-medium">
                              {subField.label} {subField.required && <span className="text-red-500">*</span>}
                            </label>
                            <FileUpload
                              accept={subField.accept}
                              onFileSelect={(file) =>
                                uploadFileForRepeat(field.name, index, subField.name, file)
                              }
                              className="w-full"
                              disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                            />
                            {value && (
                              <div className="mt-2">
                                <img src={`${value}?t=${Date.now()}`} alt="Preview" className="max-w-xs mt-1" />
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })}
                    <Button
  type="button"
  onClick={() => removeGroupItem(field.name, index)}
  variant="outline"
  className="mt-2"
  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
>
  Hapus
</Button>

                  </div>
                ))}
                <Button
                  type="button"
                  onClick={() => addGroupItem(field.name, field.fields)}
                  className="mt-2"
                >
                  Tambah Pengurus
                </Button>
              </div>
            );
          }
          
          if (field.type === 'select') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Select 
                  onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`Pilih ${field.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {field.options?.map((option, index) => {
                      const optionValue = typeof option === 'string' ? option : option.value;
                      const optionLabel = typeof option === 'string' ? option : option.label;
                      return (
                        <SelectItem key={`${optionValue}-${index}`} value={optionValue}>
                          {optionLabel}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            );
          }
          if (field.type === 'multi-select') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <MultiSelect
                  options={field.options || []}
                  placeholder={`Cari dan pilih ${field.label}`}
                  value={formData[field.name] || []}
                  onChange={(selectedValues) => setFormData({ ...formData, [field.name]: selectedValues })}
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
              </div>
            );
          }
          if (field.type === 'number') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="number"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full"
                  min={0}
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
              </div>
            );
          }
          if (field.type === 'date') {
            return (
              <div key={field.name}>
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <Input
                  type="date"
                  value={formData[field.name] || ''}
                  onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                  required={field.required}
                  className="w-full"
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
              </div>
            );
          }
          if (field.type === 'file') {
            return (
              <div key={field.name} className="space-y-2">
                <label className="block mb-1 text-sm sm:text-base font-medium">
                  {field.label} {field.required && <span className="text-red-500">*</span>}
                </label>
                <FileUpload
                  accept={field.accept}
                  onFileSelect={(file) => handleFileChange(field.name, file)}
                  className="w-full"
                  disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)}
                />
                {formData[field.name] && (
                  <div className="mt-2">
                    <img src={`${formData[field.name]}?t=${Date.now()}`} alt="Preview" className="max-w-xs mt-1" />
                  </div>
                )}
              </div>
            );
          }
          return null;
        })}

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          {submissionStatus === 'submitted' && isEditing ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsEditing(false);
                setSubmissionStatus('submitted');
              }}
              className="w-full sm:w-auto"
            >
              Batal Edit
            </Button>
          ) : submissionStatus === 'draft' ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto"
            >
              Batal
            </Button>
          ) : null}

          <Button type="submit" disabled={!isEditable || (submissionStatus === 'submitted' && !isEditing)} className="w-full sm:w-auto">
            {isSavingDraft && (
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            )}
            {submissionStatus === 'submitted' ? 'Telah Disubmit' : (isSavingDraft ? 'Menyimpan Draft...' : 'Submit')}
          </Button>
          {/* Kondisi untuk Generate PDF */}
          {submissionStatus !== 'draft' && user?.role === 'admin' && (
  <Button onClick={generatePDF}>Generate PDF</Button>
)}

        </div>
      </form>

      <Dialog open={showPopup} onOpenChange={setShowPopup}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Form Berhasil Dikirim! 🎉</DialogTitle>
      <DialogDescription>
        Data formulir telah berhasil dikirim. Anda dapat menutup halaman ini atau melakukan edit kembali dengan mengklik ikon pensil di pojok kanan atas.
      </DialogDescription>
    </DialogHeader>
    <div className="flex justify-end gap-4">
      <Button onClick={() => setShowPopup(false)}>Tutup</Button>
    </div>
  </DialogContent>
</Dialog>
    </div>
  );
}
