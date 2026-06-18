"use client";

import { useState, useEffect, useCallback, use } from "react";
import { 
  CheckCircle2, 
  Upload, 
  X, 
  AlertCircle, 
  Save, 
  Send, 
  FileText, 
  Phone, 
  ChevronRight,
  ArrowLeft,
  Info
} from "lucide-react";
import Link from "next/link";

const API_BASE = "/api/php";

// ─── Types ────────────────────────────────────────────────────────────────────
interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "file";
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  options?: string[];
  accept?: string;
  description?: string;
  prefix?: string;
}

interface FormSection {
  id: string;
  title: string;
  note?: string | null;
  fields: FormField[];
}

interface FormData {
  id: number;
  form_type: string;
  form_label: string;
  form_description: string;
  assigned_email: string;
  slug: string;
  note: string;
  form_structure: { sections: FormSection[] };
  created_at: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FormPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);

  const [form, setForm] = useState<FormData | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File | null>>({});
  const [fileUrls, setFileUrls] = useState<Record<string, string>>({});
  const [uploadProgress, setUploadProgress] = useState<Record<string, "idle" | "uploading" | "done" | "error">>({});
  const [status, setStatus] = useState<string>("draft");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [activeSection, setActiveSection] = useState(0);
  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});

  // ── Load form data ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    fetch(`${API_BASE}/api/forms/detail.php?slug=${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setForm(data.form);
          if (data.submission) {
            const d = data.submission.data || {};
            setValues(d);
            setStatus(data.submission.status);
            if (data.submission.status === "submitted") setIsSubmitted(true);
            // Restore file URLs from saved data
            const urls: Record<string, string> = {};
            Object.entries(d).forEach(([k, v]) => {
              if (typeof v === "string" && v.startsWith("http")) {
                const field = data.form.form_structure?.sections
                  ?.flatMap((s: FormSection) => s.fields)
                  .find((f: FormField) => f.name === k);
                if (field?.type === "file") urls[k] = v as string;
              }
            });
            setFileUrls(urls);
          }
        } else {
          setError(data.message || "Formulir tidak ditemukan.");
        }
      })
      .catch(() => setError("Tidak dapat memuat formulir."))
      .finally(() => setIsLoading(false));
  }, [slug]);

  // ── Auto-save draft ────────────────────────────────────────────────────────
  const saveDraft = useCallback(async (vals: Record<string, string>, urls: Record<string, string>) => {
    if (!slug) return;
    setSaveStatus("saving");
    const mergedData = { ...vals, ...urls };
    try {
      const res = await fetch(`${API_BASE}/api/forms/draft.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data: mergedData }),
      });
      if (res.ok) {
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } else {
        setSaveStatus("error");
      }
    } catch {
      setSaveStatus("error");
    }
  }, [slug]);

  const handleChange = (name: string, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    // Clear field-specific error if user has typed something
    if (stepErrors[name]) {
      setStepErrors((prev) => {
        const copy = { ...prev };
        delete copy[name];
        return copy;
      });
    }
    // Auto save draft after small delay
    saveDraft(next, fileUrls);
  };

  // ── File upload ────────────────────────────────────────────────────────────
  const handleFileChange = async (fieldName: string, file: File | null) => {
    if (!file) { 
      setFiles((p) => ({ ...p, [fieldName]: null })); 
      setFileUrls((p) => {
        const next = { ...p };
        delete next[fieldName];
        return next;
      });
      setValues((p) => {
        const next = { ...p };
        delete next[fieldName];
        return next;
      });
      setUploadProgress((p) => {
        const next = { ...p };
        delete next[fieldName];
        return next;
      });

      // Call backend API in the background to delete from Backblaze and update database draft
      fetch(`${API_BASE}/api/upload/delete.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fieldName }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errText = await res.text();
            console.error(`Gagal menghapus file di server (HTTP ${res.status}):`, errText);
          } else {
            const data = await res.json();
            if (data.success) {
              console.log("Berkas berhasil dihapus dari Backblaze B2 dan database.");
            } else {
              console.error("Gagal menghapus berkas:", data.message);
            }
          }
        })
        .catch((err) => {
          console.error("Gagal menghubungi server untuk menghapus berkas:", err);
        });
      return; 
    }
    
    setFiles((p) => ({ ...p, [fieldName]: file }));
    setUploadProgress((p) => ({ ...p, [fieldName]: "uploading" }));

    const fd = new FormData();
    fd.append("file", file);
    fd.append("slug", slug);
    fd.append("fieldName", fieldName);

    try {
      const res = await fetch(`${API_BASE}/api/upload/index.php`, {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (data.success) {
        setFileUrls((p) => {
          const next = { ...p, [fieldName]: data.fileUrl };
          saveDraft(values, next);
          return next;
        });
        setUploadProgress((p) => ({ ...p, [fieldName]: "done" }));
        if (stepErrors[fieldName]) {
          setStepErrors((prev) => {
            const copy = { ...prev };
            delete copy[fieldName];
            return copy;
          });
        }
      } else {
        setUploadProgress((p) => ({ ...p, [fieldName]: "error" }));
      }
    } catch {
      setUploadProgress((p) => ({ ...p, [fieldName]: "error" }));
    }
  };

  // ── Step Validation ────────────────────────────────────────────────────────
  const validateCurrentStep = (stepIdx: number): boolean => {
    const sections = form?.form_structure?.sections ?? [];
    if (stepIdx >= sections.length) return true; // Review step

    const currentSection = sections[stepIdx];
    const errors: Record<string, string> = {};

    currentSection.fields.forEach((field) => {
      if (field.required) {
        if (field.type === "file") {
          if (!fileUrls[field.name]) {
            errors[field.name] = `${field.label} wajib diunggah.`;
          }
        } else {
          if (!values[field.name] || !values[field.name].trim()) {
            errors[field.name] = `${field.label} wajib diisi.`;
          }
        }
      }
    });

    setStepErrors(errors);
    
    const hasErrors = Object.keys(errors).length > 0;
    if (hasErrors) {
      // Find the first error element and scroll to it
      const firstErrField = Object.keys(errors)[0];
      const el = document.getElementById(`field-container-${firstErrField}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    return !hasErrors;
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    const sections = form?.form_structure?.sections ?? [];
    
    // Final check for all steps
    for (let i = 0; i < sections.length; i++) {
      if (!validateCurrentStep(i)) {
        setActiveSection(i);
        setError("Harap lengkapi semua field wajib sebelum mengirimkan formulir.");
        return;
      }
    }

    setIsSubmitting(true);
    setError("");
    try {
      const mergedData = { ...values, ...fileUrls };
      const res = await fetch(`${API_BASE}/api/forms/submit.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, data: mergedData }),
      });
      const data = await res.json();
      if (data.success) {
        setIsSubmitted(true);
        setStatus("submitted");
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setError(data.message || "Gagal mengirim formulir.");
      }
    } catch {
      setError("Tidak dapat menghubungi server. Silakan coba beberapa saat lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-500/20 border-t-blue-600 rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm font-medium">Memuat formulir...</p>
        </div>
      </div>
    );
  }

  if (error && !form) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-lg">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Formulir Tidak Ditemukan</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.href = "https://dokasah.web.id"} 
            className="inline-flex items-center justify-center px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
          >
            Kembali ke Beranda
          </button>
        </div>
      </div>
    );
  }

  const sections = form?.form_structure?.sections ?? [];

  // ─── Success state ────────────────────────────────────────────────────────
  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-lg w-full text-center space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 sm:p-10 border border-slate-200/60 dark:border-slate-800/80">
            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-8 ring-green-500/5">
              <CheckCircle2 className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Formulir Berhasil Terkirim!</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
              Terima kasih! Seluruh data dan dokumen Anda telah berhasil kami terima. Tim analis Dokasah akan segera memproses pengajuan Anda.
            </p>
            
            <div className="mt-8 p-5 bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl border border-blue-100/60 dark:border-blue-900/30 text-left">
              <h3 className="text-xs text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider mb-2">Alur Langkah Selanjutnya</h3>
              <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-2.5">
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                  <span><strong>Validasi Dokumen</strong>: Tim analis kami memeriksa kelayakan data & berkas dalam 1x24 jam.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                  <span><strong>Konfirmasi WhatsApp</strong>: Anda akan menerima notifikasi status pengajuan melalui WhatsApp resmi kami.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                  <span><strong>Draft Akta & Izin</strong>: Setelah dokumen divalidasi, draft akta pendirian/izin usaha akan kami kirim untuk review Anda.</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href={`https://wa.me/6287767518217?text=Halo%20Dokasah,%20saya%20sudah%20mengisi%20formulir%20${encodeURIComponent(form?.form_label ?? "")}.%20Mohon%20info%20proses%20selanjutnya.`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors text-sm shadow-md shadow-green-500/10"
              >
                <Phone className="w-4 h-4" />
                Hubungi CS WhatsApp
              </a>
              <button
                onClick={() => window.location.href = "https://dokasah.web.id"}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold transition-colors text-sm"
              >
                Kembali ke Beranda
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Form UI ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/60 dark:border-slate-800/80 shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xs">D</span>
            </div>
            <div>
              <p className="font-bold text-slate-800 dark:text-white text-sm leading-tight">Dokasah</p>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">Pengisian Formulir Publik</p>
            </div>
          </div>
          
          {/* Subtle auto-save status indicator */}
          <div className="flex items-center gap-2">
            {saveStatus === "saving" && (
              <span className="text-xs text-slate-400 dark:text-slate-500 flex items-center gap-1.5 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                Menyimpan...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                Draf Disimpan
              </span>
            )}
            {saveStatus === "error" && (
              <span className="text-xs text-red-500 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                Gagal Simpan
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl w-full mx-auto px-4 py-8 flex-1 pb-32">
        {/* Title Card */}
        <div className="mb-8 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-lg relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl"></div>
          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-semibold uppercase tracking-wider border border-blue-500/20">
              <FileText className="w-3.5 h-3.5" />
              Layanan Legalitas Resmi
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{form?.form_label}</h1>
            {form?.form_description && (
              <p className="text-xs text-slate-300 leading-relaxed">{form.form_description}</p>
            )}
          </div>
        </div>

        {/* ── Visual Stepper Navigation ───────────────────────────────────────── */}
        {sections.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/60 dark:border-slate-800/80 p-5 mb-8 shadow-sm">
            <div className="flex items-center justify-between relative">
              {/* Connector Lines */}
              <div className="absolute top-[18px] left-[5%] right-[5%] h-[2px] bg-slate-100 dark:bg-slate-800 z-0" />
              <div 
                className="absolute top-[18px] left-[5%] h-[2px] bg-gradient-to-r from-blue-500 to-indigo-600 z-0 transition-all duration-500"
                style={{ width: `${(Math.min(activeSection, sections.length) / sections.length) * 90}%` }}
              />

              {sections.map((sec, idx) => {
                const isCompleted = idx < activeSection;
                const isActive = idx === activeSection;
                return (
                  <button
                    key={sec.id}
                    onClick={() => {
                      if (idx < activeSection) {
                        setActiveSection(idx);
                        setError("");
                      } else if (idx > activeSection) {
                        // Validate previous steps before jumping forward
                        let canJump = true;
                        for (let j = activeSection; j < idx; j++) {
                          if (!validateCurrentStep(j)) {
                            canJump = false;
                            break;
                          }
                        }
                        if (canJump) {
                          setActiveSection(idx);
                          setError("");
                        }
                      }
                    }}
                    className="relative z-10 flex flex-col items-center group focus:outline-none"
                    style={{ flex: 1 }}
                  >
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                      isCompleted 
                        ? "bg-green-500 border-green-500 text-white shadow-md shadow-green-500/10" 
                        : isActive
                        ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/10 shadow-md shadow-blue-500/10"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                    }`}>
                      {isCompleted ? <CheckCircle2 className="w-4.5 h-4.5" /> : idx + 1}
                    </div>
                    <span className={`text-[10px] mt-2 font-medium transition-colors hidden sm:block ${
                      isActive ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400"
                    }`}>
                      {sec.title}
                    </span>
                  </button>
                );
              })}

              {/* Review Step Button */}
              <button
                onClick={() => {
                  let canJump = true;
                  for (let j = activeSection; j < sections.length; j++) {
                    if (!validateCurrentStep(j)) {
                      canJump = false;
                      break;
                    }
                  }
                  if (canJump) {
                    setActiveSection(sections.length);
                    setError("");
                  }
                }}
                disabled={activeSection < sections.length - 1}
                className="relative z-10 flex flex-col items-center group focus:outline-none"
                style={{ flex: 1 }}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all duration-300 ${
                  activeSection === sections.length
                    ? "bg-blue-600 border-blue-600 text-white ring-4 ring-blue-500/10 shadow-md shadow-blue-500/10"
                    : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400"
                }`}>
                  <FileText className="w-4.5 h-4.5" />
                </div>
                <span className={`text-[10px] mt-2 font-medium transition-colors hidden sm:block ${
                  activeSection === sections.length ? "text-blue-600 dark:text-blue-400 font-semibold" : "text-slate-400"
                }`}>
                  Tinjau Data
                </span>
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-2xl text-sm text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        {/* Admin/User note if present */}
        {form?.note && activeSection === 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-400 flex gap-2.5 items-start">
            <Info className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Catatan Khusus: </span>
              {form.note}
            </div>
          </div>
        )}

        {/* ─── Render Current Step Section ────────────────────────────────────── */}
        {activeSection < sections.length ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden transition-all duration-300">
              {/* Section Header */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/30">
                <h2 className="font-bold text-slate-800 dark:text-white text-base leading-tight">
                  {sections[activeSection].title}
                </h2>
                {sections[activeSection].note && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {sections[activeSection].note}
                  </p>
                )}
              </div>

              {/* Fields inside Section */}
              <div className="p-6 space-y-6">
                {sections[activeSection].fields.map((field) => (
                  <div key={field.name} id={`field-container-${field.name}`}>
                    <FormField
                      field={field}
                      value={values[field.name] ?? ""}
                      fileUrl={fileUrls[field.name]}
                      uploadStatus={uploadProgress[field.name] ?? "idle"}
                      onChange={(v) => handleChange(field.name, v)}
                      onFileChange={(f) => handleFileChange(field.name, f)}
                      disabled={isSubmitted}
                      error={stepErrors[field.name]}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* ─── Render Review Section ───────────────────────────────────────── */
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/60 dark:border-slate-800/80 shadow-sm overflow-hidden p-6 sm:p-8">
              <h2 className="text-lg font-bold text-slate-850 dark:text-white mb-2 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <FileText className="w-5.5 h-5.5 text-blue-500" />
                Tinjau Seluruh Informasi Anda
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
                Silakan lakukan verifikasi atas seluruh informasi dan berkas dokumen di bawah ini. Jika ada yang salah, klik tombol "Kembali" untuk mengeditnya.
              </p>

              <div className="space-y-6">
                {sections.map((section, sIdx) => (
                  <div key={section.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <h3 className="text-xs font-bold text-blue-650 dark:text-blue-400 uppercase tracking-wider">
                        {section.title}
                      </h3>
                      <button
                        onClick={() => {
                          setStepErrors({});
                          setActiveSection(sIdx);
                        }}
                        className="text-xs text-slate-450 hover:text-blue-600 hover:underline font-medium"
                      >
                        Ubah
                      </button>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl p-4 border border-slate-100 dark:border-slate-900 space-y-3">
                      {section.fields.map((field) => {
                        const val = field.type === "file" ? fileUrls[field.name] : values[field.name];
                        return (
                          <div key={field.name} className="flex flex-col sm:flex-row sm:justify-between sm:items-start text-xs py-1.5 border-b border-slate-200/40 dark:border-slate-800/40 last:border-0 gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0 font-medium">{field.label}</span>
                            <span className="font-semibold text-slate-800 dark:text-slate-250 break-all text-left sm:text-right">
                              {field.type === "file" ? (
                                val ? (
                                  <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1">
                                    <FileText className="w-3.5 h-3.5" />
                                    Lihat Berkas Dokumen ↑
                                  </a>
                                ) : (
                                  <span className="text-red-500 font-medium">Belum diunggah</span>
                                )
                              ) : val || "–"}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Sticky Navigation Bottom Bar ───────────────────────────────────────── */}
      {!isSubmitted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/60 dark:border-slate-800/80 shadow-lg z-10 transition-colors duration-300">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
            {activeSection > 0 && (
              <button
                onClick={() => {
                  setStepErrors({});
                  setActiveSection((p) => p - 1);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-slate-250 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali
              </button>
            )}

            {activeSection < sections.length ? (
              <button
                onClick={() => {
                  if (validateCurrentStep(activeSection)) {
                    setActiveSection((p) => p + 1);
                    setError("");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }
                }}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md shadow-blue-500/10 transition-colors"
              >
                Langkah Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-650 hover:from-blue-750 hover:to-indigo-750 text-white text-sm font-semibold shadow-md shadow-blue-500/20 transition-all disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Mengirim Formulir...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Kirim Formulir Final
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-center text-[10px] text-slate-400 dark:text-slate-500 pb-2">
            Perubahan Anda otomatis disimpan sebagai draf
          </p>
        </div>
      )}
    </div>
  );
}

// ─── FormField component ──────────────────────────────────────────────────────
function FormField({
  field,
  value,
  fileUrl,
  uploadStatus,
  onChange,
  onFileChange,
  disabled,
  error,
}: {
  field: FormField;
  value: string;
  fileUrl?: string;
  uploadStatus: "idle" | "uploading" | "done" | "error";
  onChange: (v: string) => void;
  onFileChange: (f: File | null) => void;
  disabled: boolean;
  error?: string;
}) {
  const borderClass = error 
    ? "border-red-400 dark:border-red-500 focus:ring-red-500/20 focus:border-red-500" 
    : "border-slate-200 dark:border-slate-800 hover:border-slate-350 dark:hover:border-slate-700 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500";

  const baseClass = `w-full px-4 py-2.5 text-sm rounded-xl border transition-all focus:outline-none focus:ring-2 disabled:bg-slate-50 disabled:text-slate-400 dark:disabled:bg-slate-900/50 ${
    disabled ? "bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed" : "bg-white dark:bg-slate-900"
  } ${borderClass}`;

  if (field.type === "file") {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
        {field.description && (
          <p className="text-xs text-slate-450 dark:text-slate-500 leading-normal">{field.description}</p>
        )}

        {fileUrl && uploadStatus !== "uploading" ? (
          <div className="flex items-center gap-3 p-3.5 bg-green-50/60 dark:bg-green-950/10 border border-green-200/60 dark:border-green-900/30 rounded-xl">
            <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-green-700 dark:text-green-400 font-semibold">Berkas Berhasil Diunggah</p>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate block font-medium mt-0.5"
              >
                Lihat file saat ini →
              </a>
            </div>
            {!disabled && (
              <button
                onClick={() => {
                  if (window.confirm("Apakah Anda yakin ingin menghapus berkas ini? File ini juga akan dihapus secara permanen dari server penyimpanan (Backblaze).")) {
                    onFileChange(null);
                  }
                }}
                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                type="button"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        ) : (
          <label className={`flex flex-col items-center justify-center gap-2.5 p-6 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
            uploadStatus === "uploading"
              ? "border-blue-400 bg-blue-50/30 dark:bg-blue-950/10"
              : uploadStatus === "error" || error
              ? "border-red-400 bg-red-50/20 dark:bg-red-950/5"
              : "border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-550 hover:bg-blue-50/10 dark:hover:bg-blue-950/5"
          } ${disabled ? "cursor-not-allowed opacity-50" : ""}`}>
            <input
              type="file"
              accept={field.accept || "image/*,.pdf"}
              onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
              disabled={disabled || uploadStatus === "uploading"}
              className="sr-only"
            />
            {uploadStatus === "uploading" ? (
              <>
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Sedang mengunggah dokumen...</p>
              </>
            ) : uploadStatus === "error" ? (
              <>
                <X className="w-6 h-6 text-red-500" />
                <p className="text-xs text-red-500 font-medium">Upload gagal. Silakan klik untuk coba lagi.</p>
              </>
            ) : (
              <>
                <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/30 rounded-xl flex items-center justify-center">
                  <Upload className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-center space-y-0.5">
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-350">Klik untuk pilih & unggah berkas</p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">Mendukung Format JPG, PNG, PDF (Maks 5MB)</p>
                </div>
              </>
            )}
          </label>
        )}
        {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">{error}</p>}
      </div>
    );
  }

  if (field.type === "select") {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          required={field.required}
          disabled={disabled}
          className={baseClass}
        >
          <option value="">Pilih opsi...</option>
          {field.options?.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">{error}</p>}
      </div>
    );
  }

  if (field.type === "textarea") {
    return (
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
          {field.label}
          {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
        </label>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
          rows={3}
          className={`${baseClass} resize-none`}
        />
        {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {field.label}
        {field.required && <span className="text-red-500 ml-1 font-bold">*</span>}
      </label>
      <div className={field.prefix ? "flex items-center border rounded-xl overflow-hidden hover:border-slate-350 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all " + (error ? "border-red-400 focus-within:ring-red-500/20 focus-within:border-red-500" : "border-slate-200 dark:border-slate-800") : ""}>
        {field.prefix && (
          <span className="px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 text-sm text-slate-500 dark:text-slate-400 font-semibold select-none">
            {field.prefix}
          </span>
        )}
        <input
          type={field.type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
          required={field.required}
          disabled={disabled}
          maxLength={field.maxLength}
          className={field.prefix ? "flex-1 px-4 py-2.5 text-sm focus:outline-none bg-white dark:bg-slate-900 disabled:bg-slate-50 dark:disabled:bg-slate-900/50" : baseClass}
        />
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 font-medium mt-1">{error}</p>}
    </div>
  );
}
