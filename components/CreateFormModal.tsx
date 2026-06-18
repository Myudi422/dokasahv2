"use client";
import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus, Copy, Check, ExternalLink, MessageCircle, ChevronDown } from "lucide-react";
import { useAuth } from "@/components/AuthContext";

const API_BASE = "/api/php";

const FORM_OPTIONS = [
  { value: "nib_pribadi", label: "Pembuatan NIB Pribadi", active: true },
  { value: "pt_perorangan", label: "Pendirian PT Perorangan", active: false },
  { value: "pt_umum", label: "Pendirian PT Umum", active: false },
  { value: "cv", label: "Pendirian CV", active: false },
  { value: "yayasan", label: "Pendirian Yayasan", active: false },
  { value: "koperasi", label: "Pendirian Koperasi", active: false },
  { value: "npwp_pribadi", label: "Pembuatan NPWP Pribadi", active: false },
  { value: "npwp_badan", label: "Pembuatan NPWP Badan", active: false },
  { value: "nib_badan", label: "Pembuatan NIB Badan", active: false },
];

interface Props {
  onCreated?: () => void;
}

export default function CreateFormModal({ onCreated }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [formType, setFormType] = useState("");
  const [note, setNote] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ link: string; form_type: { label: string } } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [dropOpen, setDropOpen] = useState(false);
  const { token } = useAuth();

  const selectedOption = FORM_OPTIONS.find((o) => o.value === formType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/forms/create.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email, formType, note }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResult({ link: data.link, form_type: data.form_type });
        onCreated?.();
      } else {
        setError(data.message || "Gagal membuat formulir.");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError("Error: " + msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!result) return;
    const msg = encodeURIComponent(
      `Halo 👋, berikut link formulir *${result.form_type?.label ?? ""}* untuk Anda:\n\n${result.link}\n\nSilakan isi formulir tersebut sesuai data yang diminta. Jika ada pertanyaan, jangan ragu menghubungi kami.`
    );
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => {
      setEmail(""); setFormType(""); setNote(""); setResult(null); setError(""); setCopied(false);
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else setIsOpen(true); }}>
      <DialogTrigger asChild>
        <Button id="create-form-btn" size="sm" className="h-8 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
          <Plus className="h-3.5 w-3.5" />
          Buat Formulir
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Buat Formulir Baru</DialogTitle>
          <DialogDescription>
            Generate link formulir untuk dikirim ke klien.
          </DialogDescription>
        </DialogHeader>

        {!result ? (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="cf-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email Klien
              </label>
              <input
                id="cf-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="klien@email.com"
                required
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all"
              />
            </div>

            {/* Form type dropdown */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Jenis Formulir
              </label>
              <div className="relative">
                <button
                  type="button"
                  id="cf-formtype"
                  onClick={() => setDropOpen(!dropOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg border border-slate-200 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-all text-left"
                >
                  <span className={selectedOption ? "text-slate-800" : "text-slate-400"}>
                    {selectedOption ? (
                      <span className="flex items-center gap-2">
                        {selectedOption.label}
                        {!selectedOption.active && (
                          <span className="text-xs text-amber-500 bg-amber-50 px-1.5 py-0.5 rounded">Coming soon</span>
                        )}
                      </span>
                    ) : "Pilih jenis formulir..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
                </button>
                {dropOpen && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                    <div className="max-h-52 overflow-y-auto py-1">
                      {FORM_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (opt.active) { setFormType(opt.value); setDropOpen(false); }
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between transition-colors ${opt.active
                            ? "hover:bg-blue-50 text-slate-700 hover:text-blue-700 cursor-pointer"
                            : "text-slate-300 cursor-not-allowed"
                            } ${formType === opt.value ? "bg-blue-50 text-blue-700" : ""}`}
                        >
                          {opt.label}
                          {!opt.active && <span className="text-xs text-slate-300">Segera hadir</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Note */}
            <div>
              <label htmlFor="cf-note" className="block text-sm font-medium text-slate-700 mb-1.5">
                Catatan (opsional)
              </label>
              <textarea
                id="cf-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan untuk tim internal..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all resize-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !formType || !email}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Membuat...
                  </span>
                ) : "Generate Link"}
              </Button>
            </div>
          </form>
        ) : (
          /* Success state */
          <div className="space-y-4 pt-2">
            <div className="text-center p-4 rounded-xl bg-green-50 border border-green-100">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check className="w-6 h-6 text-green-600" />
              </div>
              <p className="font-semibold text-slate-800">Formulir Berhasil Dibuat!</p>
              <p className="text-sm text-slate-500 mt-1">
                {result.form_type?.label} untuk <b>{email}</b>
              </p>
            </div>

            {/* Link */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">Link Formulir</label>
              <div className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <p className="text-xs text-slate-700 break-all flex-1 font-mono">{result.link}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded-md hover:bg-slate-200 transition-colors"
                >
                  {copied ? (
                    <Check className="w-3.5 h-3.5 text-green-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" className="gap-1.5 text-sm" onClick={() => window.open(result.link, "_blank")}>
                <ExternalLink className="w-3.5 h-3.5" />Buka Form
              </Button>
              <Button className="gap-1.5 text-sm bg-green-600 hover:bg-green-700 text-white" onClick={handleWhatsApp}>
                <MessageCircle className="w-3.5 h-3.5" />Kirim WA
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={handleClose}>
              Selesai
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
