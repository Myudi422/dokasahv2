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

  useEffect(() => {
    if (!slug || !token) return;

    const fetchForm = async () => {
      try {
        setIsLoadingForm(true);
        const res = await fetch(`http://localhost:3001/api/forms/${slug}`, {
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

        // Load opsi untuk field multi-select jika ada options_url
        const updatedFields = await Promise.all(loadedConfig.fields.map(async field => {
          if (field.type === 'multi-select' && field.options_url) {
            const res = await fetch(field.options_url);
            const json = await res.json();
            // Transform data KBLI menjadi format opsi:
            field.options = (json.data || json).map(item => ({
              value: item.Kode,
              label: `${item.Kode} - ${item.Judul}`
            }));
          }
          return field;
        }));
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

// Fungsi untuk upload file ke backend
const uploadFile = async (fieldName, file) => {
  const formPayload = new FormData();
  // Pastikan variabel 'slug' sudah tersedia di scope ini
  formPayload.append('slug', slug);
  formPayload.append('fieldName', fieldName);
  formPayload.append('file', file);

  try {
    const res = await fetch(`http://localhost:3001/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: formPayload,
    });

    const contentType = res.headers.get("content-type") || "";
    
    // Jika respons tidak OK, ambil pesan error dari respons (JSON atau text)
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

    // Pastikan respons bertipe JSON
    if (contentType.includes("application/json")) {
      const data = await res.json();
      const backendUrl = "http://localhost:3001";
      const fileUrl = `${backendUrl}${data.filePath}`;
      return fileUrl;
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
    // Pastikan mengirim field name (contoh: "Foto ktp") dan file dengan urutan yang benar
    const filePath = await uploadFile(name, file);
    setFormData(prev => ({ ...prev, [name]: filePath }));
  } catch (error) {
    console.error('Error saat upload file:', error);
  }
};

  const saveDraft = async () => {
    try {
      setIsSavingDraft(true);
      const res = await fetch(`http://localhost:3001/api/forms/${slug}/draft`, {
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
      const res = await fetch(`http://localhost:3001/api/forms/${slug}/status`, {
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
      const res = await fetch(`http://localhost:3001/api/forms/${slug}/submit`, {
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
        <Button onClick={() => router.push("/")}>Beranda</Button>
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
          {submissionStatus === 'submitted' && !isEditing && (
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {formConfig.fields.map((field) => (
          <div key={field.name}>
            <label className="block mb-1 text-sm sm:text-base font-medium">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            {field.type === 'text' && (
              <Input
                type="text"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
              />
            )}
            {field.type === 'textarea' && (
              <Textarea
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
              />
            )}
            {field.type === 'select' && (
              <Select 
                onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
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
)}
            {field.type === 'multi-select' && (
              <MultiSelect
                options={field.options || []}
                placeholder={`Cari dan pilih ${field.label}`}
                value={formData[field.name] || []}
                onChange={(selectedValues) => setFormData({ ...formData, [field.name]: selectedValues })}
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
              />
            )}
            {field.type === 'number' && (
              <Input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
                min={0}
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
              />
            )}
            {field.type === 'date' && (
              <Input
                type="date"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
                disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disabled
              />
            )}
            {field.type === 'file' && (
              <div className="space-y-2">
                <FileUpload
                  accept={field.accept}
                  onFileSelect={(file) => handleFileChange(field.name, file)}
                  className="w-full"
                  disabled={submissionStatus === 'submitted' && !isEditing} // Tambahkan disable
                />
                {formData[field.name] && (
                  <div className="mt-2">
                    <img src={`${formData[field.name]}?t=${Date.now()}`} alt="Preview" className="max-w-xs mt-1" />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

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

          <Button type="submit" disabled={submissionStatus === 'submitted' && !isEditing} className="w-full sm:w-auto">
            {isSavingDraft && (
              <span className="mr-2 h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
            )}
            {submissionStatus === 'submitted' ? 'Telah Disubmit' : (isSavingDraft ? 'Menyimpan Draft...' : 'Submit')}
          </Button>
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
          <div className="flex justify-end">
            <Button onClick={() => setShowPopup(false)}>Tutup</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
