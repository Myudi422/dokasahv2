"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Edit2, Trash2, ArrowLeft, ArrowUp, ArrowDown,
  Settings2, Layout, PlusCircle, CheckCircle2, Eye, EyeOff, Save,
  AlertCircle, ChevronRight, HelpCircle, FileCheck, Check, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/components/AuthContext";

const API_BASE = "/api/php";

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

interface FormStructure {
  id: number;
  form_type: string;
  label: string;
  description: string;
  form_structure: {
    sections: FormSection[];
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const DEFAULT_STRUCTURE = {
  sections: [
    {
      id: "data_utama",
      title: "A. Informasi Utama",
      note: "Silakan isi informasi berikut dengan benar.",
      fields: [
        {
          name: "nama_lengkap",
          label: "Nama Lengkap",
          type: "text" as const,
          required: true,
          placeholder: "Sesuai dokumen identitas..."
        }
      ]
    }
  ]
};

export default function FormAdminPage() {
  const { token } = useAuth();
  const router = useRouter();

  // List view states
  const [structures, setStructures] = React.useState<FormStructure[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState("");

  // Editor states
  const [editorMode, setEditorMode] = React.useState<"list" | "edit" | "create">("list");
  const [isSaving, setIsSaving] = React.useState(false);
  const [editingId, setEditingId] = React.useState<number | null>(null);
  
  // Active editing object
  const [formType, setFormType] = React.useState("");
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [isActive, setIsActive] = React.useState(true);
  const [sections, setSections] = React.useState<FormSection[]>([]);
  
  // Selected builder index
  const [activeSectionIdx, setActiveSectionIdx] = React.useState<number>(0);
  const [activeFieldIdx, setActiveFieldIdx] = React.useState<number | null>(null); // null means editing section config

  // Delete modal confirmation
  const [deleteConfirm, setDeleteConfirm] = React.useState<FormStructure | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Fetch all structures
  const fetchStructures = React.useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/form-structures/list.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStructures(data.structures);
      } else {
        setError(data.message || "Gagal memuat template formulir.");
      }
    } catch (e) {
      console.error(e);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  React.useEffect(() => {
    fetchStructures();
  }, [fetchStructures]);

  // Alert flash helper
  const flashSuccess = (msg: string) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(""), 4000);
  };
  const flashError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(""), 4000);
  };

  // Toggle template status
  const handleToggleActive = async (item: FormStructure) => {
    try {
      const res = await fetch(`${API_BASE}/api/form-structures/update.php`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          id: item.id,
          is_active: !item.is_active ? 1 : 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        flashSuccess(`Status template "${item.label}" berhasil diubah.`);
        fetchStructures();
      } else {
        flashError(data.message || "Gagal mengubah status template.");
      }
    } catch (e) {
      console.error(e);
      flashError("Error koneksi database.");
    }
  };

  // Open for Edit
  const handleEditClick = (item: FormStructure) => {
    setEditingId(item.id);
    setFormType(item.form_type);
    setLabel(item.label);
    setDescription(item.description);
    setIsActive(item.is_active);
    setSections(item.form_structure.sections || []);
    setActiveSectionIdx(0);
    setActiveFieldIdx(null);
    setEditorMode("edit");
    setError("");
  };

  // Open for Create
  const handleCreateClick = () => {
    setEditingId(null);
    setFormType("");
    setLabel("");
    setDescription("");
    setIsActive(true);
    setSections(JSON.parse(JSON.stringify(DEFAULT_STRUCTURE.sections)));
    setActiveSectionIdx(0);
    setActiveFieldIdx(null);
    setEditorMode("create");
    setError("");
  };

  // Save changes
  const handleSave = async () => {
    if (!label.trim()) {
      setError("Nama Formulir (label) wajib diisi.");
      return;
    }
    if (!formType.trim()) {
      setError("Key Formulir (form_type) wajib diisi.");
      return;
    }
    if (editorMode === "create" && !/^[a-z0-9_]+$/.test(formType)) {
      setError("Key Formulir hanya boleh berisi huruf kecil, angka, dan underscore.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const payload = {
        id: editingId,
        form_type: formType,
        label,
        description,
        is_active: isActive ? 1 : 0,
        form_structure: { sections }
      };

      const endpoint = editorMode === "create" ? "create.php" : "update.php";
      const method = editorMode === "create" ? "POST" : "PUT";

      const res = await fetch(`${API_BASE}/api/form-structures/${endpoint}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (res.ok && data.success) {
        flashSuccess(editorMode === "create" ? "Template formulir berhasil dibuat!" : "Template formulir berhasil disimpan!");
        setEditorMode("list");
        fetchStructures();
      } else {
        setError(data.message || "Gagal menyimpan perubahan template.");
      }
    } catch (e) {
      console.error(e);
      setError("Gagal menghubungi server backend.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete structure
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm) return;
    setIsDeleting(true);
    setError("");
    try {
      const res = await fetch(`${API_BASE}/api/form-structures/delete.php?id=${deleteConfirm.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        flashSuccess(data.message || "Template berhasil dihapus.");
        setDeleteConfirm(null);
        fetchStructures();
      } else {
        flashError(data.message || "Gagal menghapus template.");
        setDeleteConfirm(null);
      }
    } catch (e) {
      console.error(e);
      flashError("Error koneksi server.");
      setDeleteConfirm(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Section Actions ────────────────────────────────────────────────────────
  const addSection = () => {
    const newId = `section_${Date.now()}`;
    const newSec: FormSection = {
      id: newId,
      title: `Bagian Baru ${sections.length + 1}`,
      note: "",
      fields: []
    };
    const nextSecs = [...sections, newSec];
    setSections(nextSecs);
    setActiveSectionIdx(nextSecs.length - 1);
    setActiveFieldIdx(null);
  };

  const deleteSection = (idx: number) => {
    if (sections.length <= 1) {
      alert("Formulir wajib memiliki minimal 1 bagian.");
      return;
    }
    const nextSecs = sections.filter((_, i) => i !== idx);
    setSections(nextSecs);
    setActiveSectionIdx(Math.max(0, idx - 1));
    setActiveFieldIdx(null);
  };

  const moveSection = (idx: number, direction: "up" | "down") => {
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === sections.length - 1) return;
    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const nextSecs = [...sections];
    const temp = nextSecs[idx];
    nextSecs[idx] = nextSecs[targetIdx];
    nextSecs[targetIdx] = temp;
    setSections(nextSecs);
    setActiveSectionIdx(targetIdx);
    setActiveFieldIdx(null);
  };

  const updateSectionMeta = (field: "title" | "note", val: string) => {
    const nextSecs = [...sections];
    nextSecs[activeSectionIdx] = {
      ...nextSecs[activeSectionIdx],
      [field]: val
    };
    setSections(nextSecs);
  };

  // ── Field Actions ──────────────────────────────────────────────────────────
  const addField = () => {
    const defaultField: FormField = {
      name: `field_${Date.now().toString().slice(-6)}`,
      label: "Label Baru",
      type: "text",
      required: true,
      placeholder: ""
    };
    const nextSecs = [...sections];
    const currentFields = nextSecs[activeSectionIdx].fields || [];
    nextSecs[activeSectionIdx] = {
      ...nextSecs[activeSectionIdx],
      fields: [...currentFields, defaultField]
    };
    setSections(nextSecs);
    setActiveFieldIdx(nextSecs[activeSectionIdx].fields.length - 1);
  };

  const deleteField = (fIdx: number) => {
    const nextSecs = [...sections];
    const currentFields = nextSecs[activeSectionIdx].fields || [];
    nextSecs[activeSectionIdx] = {
      ...nextSecs[activeSectionIdx],
      fields: currentFields.filter((_, i) => i !== fIdx)
    };
    setSections(nextSecs);
    setActiveFieldIdx(null);
  };

  const moveField = (fIdx: number, direction: "up" | "down") => {
    const currentFields = [...(sections[activeSectionIdx].fields || [])];
    if (direction === "up" && fIdx === 0) return;
    if (direction === "down" && fIdx === currentFields.length - 1) return;
    const targetIdx = direction === "up" ? fIdx - 1 : fIdx + 1;
    const temp = currentFields[fIdx];
    currentFields[fIdx] = currentFields[targetIdx];
    currentFields[targetIdx] = temp;

    const nextSecs = [...sections];
    nextSecs[activeSectionIdx] = {
      ...nextSecs[activeSectionIdx],
      fields: currentFields
    };
    setSections(nextSecs);
    setActiveFieldIdx(targetIdx);
  };

  const updateFieldProperty = (prop: keyof FormField, val: any) => {
    if (activeFieldIdx === null) return;
    const nextSecs = [...sections];
    const currentFields = [...(nextSecs[activeSectionIdx].fields || [])];
    
    currentFields[activeFieldIdx] = {
      ...currentFields[activeFieldIdx],
      [prop]: val
    };
    nextSecs[activeSectionIdx] = {
      ...nextSecs[activeSectionIdx],
      fields: currentFields
    };
    setSections(nextSecs);
  };

  // Render Page
  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Alerts */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-650 flex gap-2.5 items-start">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div className="font-medium">{error}</div>
        </div>
      )}
      {success && (
        <div className="p-4 bg-green-50 border border-green-150 rounded-2xl text-sm text-green-700 flex gap-2.5 items-start animate-fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0 mt-0.5" />
          <div className="font-medium">{success}</div>
        </div>
      )}

      {editorMode === "list" ? (
        /* ─── LIST VIEW ──────────────────────────────────────────────────────── */
        <>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Formulir Manager</h1>
              <p className="text-sm text-slate-500 mt-1">
                Kelola template formulir pendaftaran dinamis untuk klien.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-9 px-3 rounded-xl" onClick={fetchStructures} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
                Segarkan
              </Button>
              <Button onClick={handleCreateClick} size="sm" className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm">
                <Plus className="h-4 w-4" />
                Buat Template Baru
              </Button>
            </div>
          </div>

          <Card className="border-slate-200 dark:border-slate-850">
            <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-base font-semibold">Semua Template Formulir</CardTitle>
              <CardDescription className="text-xs">
                Daftar jenis pengurusan legalitas yang terdaftar di database.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-slate-100 dark:border-slate-800">
                      <TableHead className="w-16 pl-6 text-xs font-semibold text-slate-550">ID</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-550">Nama Formulir</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-550">Key / Tipe</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-550 hidden md:table-cell">Deskripsi</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-550 text-center w-24">Status</TableHead>
                      <TableHead className="text-right pr-6 w-32 text-xs font-semibold text-slate-550">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2 text-slate-400">
                            <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
                            <p className="text-sm">Memuat data template...</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : structures.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-16 text-slate-400">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-10 h-10 text-slate-300" />
                            <p className="text-sm">Belum ada template formulir di database.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      structures.map((item) => (
                        <TableRow key={item.id} className="border-b border-slate-50 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                          <TableCell className="font-mono text-xs text-slate-400 pl-6">#{item.id}</TableCell>
                          <TableCell className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                            {item.label}
                          </TableCell>
                          <TableCell className="text-xs font-mono text-blue-600 dark:text-blue-400">
                            {item.form_type}
                          </TableCell>
                          <TableCell className="text-xs text-slate-450 dark:text-slate-400 max-w-xs truncate hidden md:table-cell">
                            {item.description || "–"}
                          </TableCell>
                          <TableCell className="text-center">
                            <button
                              onClick={() => handleToggleActive(item)}
                              className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                item.is_active ? "bg-green-500" : "bg-slate-250 dark:bg-slate-800"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                  item.is_active ? "translate-x-5" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </TableCell>
                          <TableCell className="text-right pr-6 space-x-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditClick(item)}
                              className="h-8 w-8 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirm(item)}
                              className="h-8 w-8 text-slate-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* ─── BUILDER/EDITOR VIEW ────────────────────────────────────────────── */
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-250 dark:border-slate-800 pb-5">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setEditorMode("list")}
                className="h-9 w-9 rounded-xl border-slate-200 dark:border-slate-800"
              >
                <ArrowLeft className="h-4.5 w-4.5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                  {editorMode === "create" ? "Buat Template Formulir Baru" : `Edit Template: ${label}`}
                </h1>
                <p className="text-xs text-slate-450">
                  Desain struktur bagian dan kolom input untuk diisi oleh klien.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsActive(!isActive)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-green-50/55 text-green-700 border-green-200 dark:bg-green-950/10 dark:text-green-400 dark:border-green-900/50"
                    : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400"
                }`}
              >
                {isActive ? <Check className="w-3.5 h-3.5" /> : null}
                {isActive ? "Template Aktif" : "Template Nonaktif"}
              </button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="h-9 gap-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-500/10 px-4"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Simpan Template
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
            {/* ───── 1. GENERAL CONFIG & SECTION LIST (4 Columns) ───── */}
            <div className="xl:col-span-4 space-y-6">
              {/* General Config Card */}
              <Card className="border-slate-200 dark:border-slate-850 shadow-sm">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Settings2 className="w-4 h-4 text-blue-500" />
                    Pengaturan Umum
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* Form Type Key */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                      Key Rute Formulir (form_type)
                    </label>
                    <input
                      type="text"
                      value={formType}
                      onChange={(e) => setFormType(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                      disabled={editorMode === "edit"}
                      placeholder="e.g. cv_mandiri"
                      className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
                    />
                    {editorMode === "edit" ? (
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Key tidak bisa diubah karena telah berelasi dengan formulir klien.
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">
                        Gunakan huruf kecil, angka, dan underscore saja.
                      </p>
                    )}
                  </div>

                  {/* Label */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                      Nama Layanan / Formulir
                    </label>
                    <input
                      type="text"
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. Pendirian CV Pribadi"
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                      Deskripsi Layanan (tampil di form header)
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g. Formulir pengumpulan data akta dan syarat operasional CV..."
                      rows={3}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 resize-none"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Sections List Card */}
              <Card className="border-slate-200 dark:border-slate-850 shadow-sm">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Layout className="w-4 h-4 text-blue-500" />
                    Struktur Bagian ({sections.length})
                  </CardTitle>
                  <button
                    onClick={addSection}
                    className="text-[11px] text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1 font-semibold"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Bagian Baru
                  </button>
                </CardHeader>
                <CardContent className="p-3 space-y-1.5 max-h-[360px] overflow-y-auto">
                  {sections.map((sec, idx) => {
                    const isActiveSec = idx === activeSectionIdx;
                    return (
                      <div
                        key={sec.id}
                        onClick={() => {
                          setActiveSectionIdx(idx);
                          setActiveFieldIdx(null);
                        }}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isActiveSec
                            ? "border-blue-500 bg-blue-50/20 dark:bg-blue-950/10"
                            : "border-slate-150 hover:border-slate-300 dark:border-slate-850 dark:hover:border-slate-800 hover:bg-slate-50/30 dark:hover:bg-slate-900/10"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-bold truncate ${isActiveSec ? "text-blue-650 dark:text-blue-400" : "text-slate-700 dark:text-slate-300"}`}>
                            {idx + 1}. {sec.title}
                          </p>
                          <div className="flex items-center gap-0.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              disabled={idx === 0}
                              onClick={() => moveSection(idx, "up")}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-40"
                            >
                              <ArrowUp className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                            </button>
                            <button
                              disabled={idx === sections.length - 1}
                              onClick={() => moveSection(idx, "down")}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded disabled:opacity-40"
                            >
                              <ArrowDown className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                            </button>
                            <button
                              onClick={() => deleteSection(idx)}
                              className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded group"
                            >
                              <Trash2 className="w-3 h-3 text-slate-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 truncate">
                          {sec.fields?.length || 0} kolom input terdaftar
                        </p>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            {/* ───── 2. BUILDER/PROPERTIES PANEL (4 Columns) ───── */}
            <div className="xl:col-span-4">
              <Card className="border-slate-200 dark:border-slate-850 shadow-sm min-h-[500px]">
                <CardHeader className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/30 dark:bg-slate-900/20 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      {activeFieldIdx !== null ? `Konfigurasi Input #${activeFieldIdx + 1}` : "Konfigurasi Bagian"}
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      {activeFieldIdx !== null
                        ? `Input: ${sections[activeSectionIdx].fields[activeFieldIdx]?.label}`
                        : `Bagian: ${sections[activeSectionIdx].title}`}
                    </CardDescription>
                  </div>
                  {activeFieldIdx === null && (
                    <button
                      onClick={addField}
                      className="text-[11px] bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/30 dark:text-blue-300 font-semibold px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-200/50"
                    >
                      <Plus className="w-3 h-3" /> Tambah Kolom
                    </button>
                  )}
                </CardHeader>
                <CardContent className="p-5 space-y-4">
                  {/* EDITING A SECTION */}
                  {activeFieldIdx === null ? (
                    <div className="space-y-4">
                      {/* Section Title */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Judul Bagian / Section Title
                        </label>
                        <input
                          type="text"
                          value={sections[activeSectionIdx].title}
                          onChange={(e) => updateSectionMeta("title", e.target.value)}
                          placeholder="e.g. A. Data Pribadi"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                        />
                      </div>

                      {/* Section Note */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Catatan Bantuan (Banner atas bagian)
                        </label>
                        <textarea
                          value={sections[activeSectionIdx].note || ""}
                          onChange={(e) => updateSectionMeta("note", e.target.value)}
                          placeholder="e.g. Harap unggah foto dokumen asli secara jelas..."
                          rows={3}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 resize-none"
                        />
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-3 uppercase tracking-wider">
                          Daftar Kolom Di Bagian Ini ({sections[activeSectionIdx].fields?.length || 0})
                        </h4>
                        
                        {sections[activeSectionIdx].fields?.length === 0 ? (
                          <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                            <p className="text-[11px] text-slate-450">Belum ada kolom input.</p>
                          </div>
                        ) : (
                          <div className="space-y-1.5 max-h-[220px] overflow-y-auto">
                            {sections[activeSectionIdx].fields.map((fld, fIdx) => (
                              <div
                                key={fld.name}
                                onClick={() => setActiveFieldIdx(fIdx)}
                                className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 hover:border-slate-250 dark:border-slate-900 dark:hover:border-slate-800 bg-slate-50/50 dark:bg-slate-950/20 cursor-pointer"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-slate-750 dark:text-slate-300 truncate">
                                    {fld.label}
                                  </p>
                                  <p className="text-[10px] text-slate-400 font-mono">
                                    {fld.type} • {fld.name}
                                  </p>
                                </div>
                                <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                  <button
                                    disabled={fIdx === 0}
                                    onClick={() => moveField(fIdx, "up")}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-40"
                                  >
                                    <ArrowUp className="w-3 h-3 text-slate-400" />
                                  </button>
                                  <button
                                    disabled={fIdx === (sections[activeSectionIdx].fields.length - 1)}
                                    onClick={() => moveField(fIdx, "down")}
                                    className="p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded disabled:opacity-40"
                                  >
                                    <ArrowDown className="w-3 h-3 text-slate-400" />
                                  </button>
                                  <button
                                    onClick={() => deleteField(fIdx)}
                                    className="p-1 hover:bg-red-50 dark:hover:bg-red-950/20 rounded group"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-red-500" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* EDITING A FIELD */
                    <div className="space-y-3.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveFieldIdx(null)}
                        className="h-7 px-2 -ml-2 text-slate-500 hover:text-slate-800 text-xs gap-1 hover:bg-slate-100 rounded-lg"
                      >
                        ← Kembali ke Bagian
                      </Button>

                      {/* Field Key/Name */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Key Database / Name (Unik)
                        </label>
                        <input
                          type="text"
                          value={sections[activeSectionIdx].fields[activeFieldIdx]?.name || ""}
                          onChange={(e) => updateFieldProperty("name", e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                          placeholder="e.g. nomor_telepon"
                          className="w-full text-xs font-mono px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                        />
                      </div>

                      {/* Field Label */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Label Tampilan (Display Label)
                        </label>
                        <input
                          type="text"
                          value={sections[activeSectionIdx].fields[activeFieldIdx]?.label || ""}
                          onChange={(e) => updateFieldProperty("label", e.target.value)}
                          placeholder="e.g. Nomor Telepon / WA"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                        />
                      </div>

                      {/* Field Type */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Tipe Input
                        </label>
                        <select
                          value={sections[activeSectionIdx].fields[activeFieldIdx]?.type || "text"}
                          onChange={(e) => updateFieldProperty("type", e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 bg-white"
                        >
                          <option value="text">Teks Singkat (text)</option>
                          <option value="email">Email (email)</option>
                          <option value="tel">Nomor Telepon (tel)</option>
                          <option value="number">Angka (number)</option>
                          <option value="textarea">Teks Paragraf (textarea)</option>
                          <option value="select">Pilihan / Dropdown (select)</option>
                          <option value="file">Unggah Berkas (file)</option>
                        </select>
                      </div>

                      {/* Required Checkbox */}
                      <div className="flex items-center gap-2 py-1">
                        <input
                          id="f-req"
                          type="checkbox"
                          checked={sections[activeSectionIdx].fields[activeFieldIdx]?.required || false}
                          onChange={(e) => updateFieldProperty("required", e.target.checked)}
                          className="h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="f-req" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
                          Kolom Wajib Diisi (Required)
                        </label>
                      </div>

                      {/* Helper Description */}
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                          Petunjuk Input / Deskripsi Bantuan
                        </label>
                        <input
                          type="text"
                          value={sections[activeSectionIdx].fields[activeFieldIdx]?.description || ""}
                          onChange={(e) => updateFieldProperty("description", e.target.value)}
                          placeholder="e.g. Masukkan no HP aktif tanpa kode negara (+62)"
                          className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                        />
                      </div>

                      {/* Placeholder (Only for text inputs) */}
                      {["text", "email", "tel", "number", "textarea"].includes(sections[activeSectionIdx].fields[activeFieldIdx]?.type || "") && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                            Teks Placeholder (Samaran)
                          </label>
                          <input
                            type="text"
                            value={sections[activeSectionIdx].fields[activeFieldIdx]?.placeholder || ""}
                            onChange={(e) => updateFieldProperty("placeholder", e.target.value)}
                            placeholder="e.g. Contoh: 08123456789"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                          />
                        </div>
                      )}

                      {/* Max Length (Only for text/number/textarea) */}
                      {["text", "number", "textarea"].includes(sections[activeSectionIdx].fields[activeFieldIdx]?.type || "") && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                            Batas Karakter Maksimal (maxLength)
                          </label>
                          <input
                            type="number"
                            value={sections[activeSectionIdx].fields[activeFieldIdx]?.maxLength || ""}
                            onChange={(e) => updateFieldProperty("maxLength", e.target.value ? parseInt(e.target.value) : undefined)}
                            placeholder="e.g. 16 untuk NIK"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                          />
                        </div>
                      )}

                      {/* Prefix (Only for number) */}
                      {sections[activeSectionIdx].fields[activeFieldIdx]?.type === "number" && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                            Simbol Prefix (awalan)
                          </label>
                          <input
                            type="text"
                            value={sections[activeSectionIdx].fields[activeFieldIdx]?.prefix || ""}
                            onChange={(e) => updateFieldProperty("prefix", e.target.value)}
                            placeholder="e.g. Rp atau $"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                          />
                        </div>
                      )}

                      {/* Options (Only for select) */}
                      {sections[activeSectionIdx].fields[activeFieldIdx]?.type === "select" && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                            Opsi Pilihan (Pisahkan dengan baris baru)
                          </label>
                          <textarea
                            value={(sections[activeSectionIdx].fields[activeFieldIdx]?.options || []).join("\n")}
                            onChange={(e) => updateFieldProperty("options", e.target.value.split("\n").filter(Boolean))}
                            placeholder="e.g.&#10;Laki-laki&#10;Perempuan"
                            rows={4}
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800 resize-none font-sans"
                          />
                        </div>
                      )}

                      {/* Accept (Only for file) */}
                      {sections[activeSectionIdx].fields[activeFieldIdx]?.type === "file" && (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-350 mb-1">
                            Format File yang Diterima (accept)
                          </label>
                          <input
                            type="text"
                            value={sections[activeSectionIdx].fields[activeFieldIdx]?.accept || ""}
                            onChange={(e) => updateFieldProperty("accept", e.target.value)}
                            placeholder="e.g. image/*,.pdf"
                            className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-slate-900 dark:border-slate-800"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* ───── 3. LIVE CLIENT PREVIEW (4 Columns) ───── */}
            <div className="xl:col-span-4 space-y-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-150 rounded-xl text-indigo-750 text-xs font-bold uppercase tracking-wider dark:bg-indigo-950/20 dark:border-indigo-900/40 dark:text-indigo-400">
                <Eye className="w-4.5 h-4.5 shrink-0" />
                Live Client Preview
              </div>

              {/* Mock Client Form Layout */}
              <div className="bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-900 rounded-3xl p-4 shadow-inner min-h-[460px] flex flex-col justify-between">
                <div>
                  {/* Form Header */}
                  <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-4 border border-slate-850 shadow mb-4">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[8px] font-semibold uppercase tracking-wider">
                      Layanan Legalitas Resmi
                    </div>
                    <h3 className="font-bold text-sm leading-tight mt-1">
                      {label || "Nama Formulir Belum Ditulis"}
                    </h3>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                      {description || "Deskripsi formulir belum ditulis."}
                    </p>
                  </div>

                  {/* Visual Stepper Mock */}
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-900 pb-3 mb-4 text-[9px] text-slate-400 font-bold px-1 relative">
                    <div className="absolute top-[8px] left-[5%] right-[5%] h-[1px] bg-slate-200 dark:bg-slate-900 z-0" />
                    <div className="absolute top-[8px] left-[5%] h-[1px] bg-blue-500 z-0" style={{ width: `${(activeSectionIdx / Math.max(1, sections.length - 1)) * 90}%` }} />
                    
                    {sections.map((sec, sIdx) => (
                      <div key={sec.id} className="relative z-10 flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${
                          sIdx <= activeSectionIdx
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white dark:bg-slate-900 border-slate-200 text-slate-400"
                        }`}>
                          {sIdx + 1}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Section Title & Note */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-900 rounded-2xl overflow-hidden shadow-sm mb-4">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/30">
                      <h4 className="font-bold text-xs text-slate-800 dark:text-white leading-tight">
                        {sections[activeSectionIdx]?.title || "Judul Bagian Kosong"}
                      </h4>
                      {sections[activeSectionIdx]?.note && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-0.5 leading-normal flex items-start gap-1">
                          <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" />
                          {sections[activeSectionIdx].note}
                        </p>
                      )}
                    </div>

                    {/* Rendering Fields Mock */}
                    <div className="p-4 space-y-4">
                      {sections[activeSectionIdx]?.fields?.length === 0 ? (
                        <p className="text-center py-6 text-[10px] text-slate-400">Belum ada kolom input di bagian ini.</p>
                      ) : (
                        sections[activeSectionIdx].fields.map((fld, fIdx) => {
                          const isSelectedFld = fIdx === activeFieldIdx;
                          return (
                            <div
                              key={fld.name}
                              className={`p-2 rounded-xl border transition-all ${
                                isSelectedFld
                                  ? "border-blue-500 bg-blue-500/5 ring-1 ring-blue-500"
                                  : "border-transparent"
                              }`}
                            >
                              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                                {fld.label || "Label Kosong"}
                                {fld.required && <span className="text-red-500 ml-0.5 font-bold">*</span>}
                              </label>
                              
                              {fld.description && (
                                <p className="text-[9px] text-slate-450 dark:text-slate-500 leading-normal mb-1">
                                  {fld.description}
                                </p>
                              )}

                              {/* TEXT, EMAIL, TEL, NUMBER inputs */}
                              {["text", "email", "tel"].includes(fld.type) && (
                                <input
                                  type="text"
                                  placeholder={fld.placeholder || "Masukkan data..."}
                                  disabled
                                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg focus:outline-none"
                                />
                              )}

                              {/* NUMBER WITH PREFIX */}
                              {fld.type === "number" && (
                                <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden text-xs">
                                  {fld.prefix && (
                                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-slate-500 shrink-0 select-none">
                                      {fld.prefix}
                                    </span>
                                  )}
                                  <input
                                    type="text"
                                    placeholder={fld.placeholder || "0"}
                                    disabled
                                    className="w-full px-3 py-2 dark:bg-slate-900 focus:outline-none"
                                  />
                                </div>
                              )}

                              {/* TEXTAREA input */}
                              {fld.type === "textarea" && (
                                <textarea
                                  placeholder={fld.placeholder || "Tuliskan jawaban Anda..."}
                                  disabled
                                  rows={2}
                                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg focus:outline-none resize-none"
                                />
                              )}

                              {/* SELECT dropdown */}
                              {fld.type === "select" && (
                                <select
                                  disabled
                                  className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg focus:outline-none bg-white"
                                >
                                  <option value="">Pilih opsi...</option>
                                  {(fld.options || []).map((opt) => (
                                    <option key={opt} value={opt}>
                                      {opt}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {/* FILE upload */}
                              {fld.type === "file" && (
                                <div className="border border-dashed border-slate-200 dark:border-slate-800 dark:bg-slate-900 rounded-lg p-3 text-center flex flex-col items-center justify-center gap-1">
                                  <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-350">
                                    Klik untuk unggah berkas
                                  </span>
                                  <span className="text-[8px] text-slate-400">
                                    {fld.accept ? `Menerima: ${fld.accept}` : "Menerima: PDF, JPG, PNG"} (Maks 5MB)
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                {/* Stepper controls */}
                <div className="flex gap-2">
                  <Button variant="outline" disabled className="flex-1 text-[10px] h-8 rounded-lg">
                    Kembali
                  </Button>
                  <Button disabled className="flex-[2] text-[10px] h-8 bg-blue-600 text-white rounded-lg">
                    Langkah Selanjutnya →
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CONFIRMATION DIALOG ──────────────────────────────────────── */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={(open) => { if (!open) setDeleteConfirm(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base font-bold">Hapus Template Formulir?</DialogTitle>
              <DialogDescription className="text-xs">
                Apakah Anda yakin ingin menghapus template formulir <b>{deleteConfirm.label}</b>?
                Tindakan ini tidak dapat dibatalkan. Sistem akan menolak jika template ini sedang digunakan oleh klien aktif.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="rounded-xl">
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white rounded-xl"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  "Hapus Permanen"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
