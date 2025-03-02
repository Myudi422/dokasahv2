"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth, useAuthRedirect } from '@/components/AuthContext';
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { FileUpload } from "@/components/FileUpload";

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
  const [files, setFiles] = useState({});

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
        setFormConfig(data.form);
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

  const handleFileChange = (name, file) => {
    setFiles({ ...files, [name]: file });
    setFormData({ ...formData, [name]: file.name });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      formDataToSend.append(key, value);
    });
    
    Object.entries(files).forEach(([key, file]) => {
      formDataToSend.append(key, file);
    });

    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (res.ok) {
        setSubmissionStatus('submitted');
        router.push('/thank-you');
      }
    } catch (error) {
      console.error('Submission error:', error);
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
        <Button onClick={() => router.push("/")}>
          Beranda
        </Button>
      </div>
    );
  }

  const defaultFormConfig = {
    title: "Formulir Pendaftaran Usaha",
    fields: [
      { name: 'nama_pt', label: 'Nama PT', type: 'text', required: true },
      { name: 'nama_singkatan_pt', label: 'Nama Singkatan PT', type: 'text', required: true },
      { name: 'jenis_usaha', label: 'Jenis Usaha', type: 'text', required: true },
      { name: 'nama_pemilik', label: 'Nama Pemilik/Pendiri', type: 'text', required: true },
      { name: 'foto_ktp', label: 'Foto KTP', type: 'file', required: true },
      { name: 'nik', label: 'NIK', type: 'text', required: true },
      { name: 'tgl_lahir', label: 'Tgl. Lahir', type: 'date', required: true },
      { name: 'jenis_kelamin', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'], required: true },
      { name: 'pendidikan', label: 'Pendidikan', type: 'select', options: ['SD', 'SMP', 'SMA', 'Diploma', 'Sarjana', 'Pascasarjana'], required: true },
      { name: 'npwp_upload', label: 'NPWP Upload Foto', type: 'file', required: true },
      { name: 'no_hp', label: 'No. Hp', type: 'text', required: true },
      { name: 'alamat_ktp', label: 'Alamat Sesuai KTP', type: 'textarea', required: true },
      { name: 'alamat_usaha', label: 'Alamat Usaha', type: 'textarea', required: true },
      { name: 'desa_kelurahan', label: 'Desa/Kelurahan', type: 'text', required: true },
      { name: 'kecamatan', label: 'Kecamatan', type: 'text', required: true },
      { name: 'kabupaten_kota', label: 'Kabupaten/Kota', type: 'text', required: true },
      { name: 'provinsi', label: 'Provinsi', type: 'text', required: true },
      { name: 'kode_pos', label: 'Kode Pos', type: 'text', required: true },
      { name: 'status_tempat_usaha', label: 'Status Tempat Usaha', type: 'select', options: ['Milik Sendiri', 'Sewa'], required: true },
      { name: 'luas_tempat_usaha', label: 'Luas Tempat Usaha (m²)', type: 'number', required: true },
      { name: 'jumlah_karyawan', label: 'Jumlah Karyawan', type: 'number', required: true },
      { name: 'modal_usaha', label: 'Modal Usaha', type: 'number', required: true },
      { name: 'penjualan_pertahun', label: 'Penjualan Pertahun', type: 'number', required: true },
      { name: 'penjelasan_aktivitas', label: 'Penjelasan Aktivitas Usaha', type: 'textarea', required: true },
    ]
  };
  
  // Gunakan defaultFormConfig secara langsung
  const currentFormConfig = formConfig && formConfig.fields ? formConfig : defaultFormConfig;

  if (!currentFormConfig || !Array.isArray(currentFormConfig.fields)) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading form...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 md:p-8 space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-center">{currentFormConfig.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {currentFormConfig.fields.map((field) => (
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
              />
            )}

            {field.type === 'textarea' && (
              <Textarea
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
              />
            )}

            {field.type === 'select' && (
              <Select onValueChange={(value) => setFormData({ ...formData, [field.name]: value })}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={`Pilih ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map(option => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'number' && (
              <Input
                type="number"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
              />
            )}

            {field.type === 'date' && (
              <Input
                type="date"
                value={formData[field.name] || ''}
                onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                required={field.required}
                className="w-full"
              />
            )}

            {field.type === 'file' && (
              <FileUpload
                accept="image/*"
                onFileSelect={(file) => handleFileChange(field.name, file)}
                className="w-full"
              />
            )}
          </div>
        ))}

        <div className="flex flex-col sm:flex-row justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            className="w-full sm:w-auto"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={submissionStatus === 'submitted'}
            className="w-full sm:w-auto"
          >
            {submissionStatus === 'submitted' ? 'Telah Disubmit' : 'Submit'}
          </Button>
        </div>
      </form>
    </div>
  );
}