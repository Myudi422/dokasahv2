"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Folder, LogOut, Menu, MoreHorizontal,
  FileArchive, LoaderIcon, Users, ChevronUp, ChevronDown, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp, Copy, ExternalLink,
  NotepadText, Trash2, RefreshCw,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth, useAuthRedirect } from "@/components/AuthContext";
import CreateFormModal from "@/components/CreateFormModal";

const API_BASE = "/api/php";

// ─── Status helpers ──────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:     { label: "Draft",     color: "text-slate-600", bg: "bg-slate-100",  icon: <Clock className="w-3 h-3" /> },
  submitted: { label: "Submitted", color: "text-blue-600",  bg: "bg-blue-100",   icon: <FileText className="w-3 h-3" /> },
  proses:    { label: "Proses",    color: "text-amber-600", bg: "bg-amber-100",  icon: <LoaderIcon className="w-3 h-3" /> },
  review:    { label: "Review",    color: "text-purple-600",bg: "bg-purple-100", icon: <AlertCircle className="w-3 h-3" /> },
  selesai:   { label: "Selesai",   color: "text-green-600", bg: "bg-green-100",  icon: <CheckCircle2 className="w-3 h-3" /> },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status?.toLowerCase()] ?? STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
      {cfg.icon}{cfg.label}
    </span>
  );
}

// ─── Types ───────────────────────────────────────────────────────────────────
interface FormItem {
  id: number;
  form_type: string;
  form_label: string;
  assigned_wa: string;
  slug: string;
  note: string;
  status: string;
  link: string;
  created_at: string;
  last_updated: string | null;
}

interface Stats {
  total: number;
  draft: number;
  submitted: number;
  proses: number;
  review: number;
  selesai: number;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user, isAuthLoaded, token, setToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [forms, setForms] = React.useState<FormItem[]>([]);
  const [stats, setStats] = React.useState<Stats | null>(null);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [sortConfig, setSortConfig] = React.useState({ key: "created_at", direction: "descending" });
  const [selectedForm, setSelectedForm] = React.useState<FormItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState<FormItem | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [isPdfLoading, setIsPdfLoading] = React.useState<string | null>(null);
  const itemsPerPage = 8;

  useAuthRedirect();

  // ── Fetch helpers ─────────────────────────────────────────────────────────
  const fetchForms = React.useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/api/forms/list.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setForms(data.forms);
      }
    } catch (e) { console.error(e); }
  }, [token]);

  const fetchStats = React.useCallback(async () => {
    if (!token || user?.role !== "admin") return;
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/stats.php`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) setStats(data.counts);
      }
    } catch (e) { console.error(e); }
  }, [token, user?.role]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([fetchForms(), fetchStats()]);
    setIsRefreshing(false);
  };

  React.useEffect(() => {
    if (token) {
      fetchForms();
      fetchStats();
      const interval = setInterval(() => { fetchForms(); fetchStats(); }, 30000);
      return () => clearInterval(interval);
    }
  }, [token, fetchForms, fetchStats]);

  // ── Sorting & Pagination ──────────────────────────────────────────────────
  const sortedForms = React.useMemo(() => {
    const sorted = [...forms];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const av = a[sortConfig.key as keyof FormItem] ?? "";
        const bv = b[sortConfig.key as keyof FormItem] ?? "";
        if (av < bv) return sortConfig.direction === "ascending" ? -1 : 1;
        if (av > bv) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }, [forms, sortConfig]);

  const totalPages = Math.ceil(sortedForms.length / itemsPerPage);
  const paginated = sortedForms.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleSort = (key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "ascending" ? "descending" : "ascending",
    }));
    setCurrentPage(1);
  };
  const handleLogout = () => { setToken(null); router.push("/login"); };

  const handleChangeStatus = async (slug: string, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/forms/status.php`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ slug, status }),
      });
      if (res.ok) { fetchForms(); fetchStats(); }
    } catch (e) { console.error(e); }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await fetch(`${API_BASE}/api/forms/delete.php?slug=${deleteConfirm.slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) { fetchForms(); fetchStats(); setDeleteConfirm(null); }
    } catch (e) { console.error(e); }
  };

  const copyLink = (link: string) => {
    navigator.clipboard.writeText(link);
  };

  const handlePreviewPdf = async (formItem: FormItem) => {
    setIsPdfLoading(formItem.slug);
    try {
      // 1. Fetch form details
      const detailRes = await fetch(`${API_BASE}/api/forms/detail.php?slug=${formItem.slug}`);
      if (!detailRes.ok) throw new Error("Gagal mengambil detail formulir");
      const detail = await detailRes.json();
      if (!detail.success) throw new Error(detail.message || "Gagal mengambil detail");

      const formObj = detail.form;
      const submissionObj = detail.submission;
      const responses = submissionObj?.data || {};

      // 2. Fetch watermark image through proxy and convert to base64
      let wmBase64 = "";
      try {
        const wmUrl = "/b2-assets/dokasah/wm.jpg";
        wmBase64 = await getBase64ImageFromUrl(wmUrl);
      } catch (err) {
        console.error("Gagal memuat watermark cover:", err);
      }

      // 3. Initialize jsPDF dynamically
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });

      const width = 210;
      const height = 297;
      const margin = 20;
      const contentWidth = width - (margin * 2);

      let currentY = 64;

      const addPageWithWatermark = () => {
        doc.addPage();
        if (wmBase64) {
          doc.addImage(wmBase64, "JPEG", 0, 0, width, height);
        }
        currentY = 64;
      };

      // Draw first page watermark
      if (wmBase64) {
        doc.addImage(wmBase64, "JPEG", 0, 0, width, height);
      }

      // Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(30, 58, 138);
      doc.text(formObj.form_label.toUpperCase(), margin, currentY);
      
      currentY += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.text(`ID Formulir: #${formObj.id} | Slug: ${formObj.slug}`, margin, currentY);

      currentY += 10;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, width - margin, currentY);

      currentY += 8;

      // Metadata Info Box
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(241, 245, 249);
      doc.roundedRect(margin, currentY, contentWidth, 24, 3, 3, "FD");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text("WhatsApp Klien:", margin + 5, currentY + 7);
      doc.text("Status Formulir:", margin + 5, currentY + 15);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(formObj.assigned_wa || "-", margin + 35, currentY + 7);
      
      const statusText = (submissionObj?.status || "draft").toUpperCase();
      doc.text(statusText, margin + 35, currentY + 15);

      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 116, 139);
      doc.text("Dibuat Tanggal:", margin + 95, currentY + 7);
      doc.text("Pembaruan Terakhir:", margin + 95, currentY + 15);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(15, 23, 42);
      const createdDate = new Date(formObj.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
      doc.text(createdDate, margin + 125, currentY + 7);

      const updatedDate = submissionObj?.updated_at 
        ? new Date(submissionObj.updated_at).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) 
        : "-";
      doc.text(updatedDate, margin + 125, currentY + 15);

      currentY += 32;

      // Render sections & fields
      const sections = formObj.form_structure?.sections || [];
      
      if (sections.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(10);
        doc.setTextColor(148, 163, 184);
        doc.text("Belum ada data struktur formulir.", margin, currentY);
      } else {
        for (const section of sections) {
          if (currentY > 240) {
            addPageWithWatermark();
          }

          // Section Title Banner
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, currentY, contentWidth, 8, "F");
          doc.setDrawColor(226, 232, 240);
          doc.line(margin, currentY, margin, currentY + 8);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(10);
          doc.setTextColor(30, 58, 138);
          doc.text(section.title || "Section", margin + 4, currentY + 5.5);

          currentY += 14;

          const fields = section.fields || [];
          for (const field of fields) {
            const rawVal = responses[field.name];
            let displayVal = "–";

            if (field.type === "file") {
              displayVal = rawVal ? `TERUNGGAH: ${rawVal}` : "BELUM DIUNGGAH";
            } else {
              displayVal = rawVal || "–";
            }

            const labelLines = doc.splitTextToSize(field.label || "", 45);
            const valueLines = doc.splitTextToSize(displayVal, contentWidth - 50);

            const rowHeight = Math.max(labelLines.length * 4, valueLines.length * 4) + 4;

            if (currentY + rowHeight > 258) {
              addPageWithWatermark();
            }

            doc.setFont("helvetica", "bold");
            doc.setFontSize(9);
            doc.setTextColor(71, 85, 105);
            doc.text(labelLines, margin, currentY);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(9);
            doc.setTextColor(15, 23, 42);
            doc.text(valueLines, margin + 48, currentY);

            doc.setDrawColor(241, 245, 249);
            doc.setLineWidth(0.2);
            doc.line(margin, currentY + rowHeight - 2, width - margin, currentY + rowHeight - 2);

            currentY += rowHeight;
          }

          currentY += 6;
        }
      }

      // Open PDF in a new tab instead of downloading automatically
      const pdfUrl = doc.output("bloburl");
      window.open(pdfUrl, "_blank");
    } catch (error) {
      console.error("Gagal membuat preview PDF:", error);
      alert("Gagal membuat PDF. Coba lagi.");
    } finally {
      setIsPdfLoading(null);
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────
  if (!isAuthLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/50 dark:border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Selamat datang, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAdmin ? "Admin Panel — Kelola semua formulir klien" : "Client Portal — Formulir Anda"}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-9 px-3 text-slate-500 dark:text-slate-300 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${isRefreshing ? "animate-spin" : ""}`} />
            Segarkan
          </Button>
          {isAdmin && <CreateFormModal onCreated={() => { fetchForms(); fetchStats(); }} />}
        </div>
      </div>

          {/* Stats cards — admin only */}
          {isAdmin && stats && (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
              <StatCard label="Total" value={stats.total} color="blue" icon={<FileText className="w-4 h-4" />} />
              <StatCard label="Draft" value={stats.draft} color="slate" icon={<Clock className="w-4 h-4" />} />
              <StatCard label="Submitted" value={stats.submitted} color="indigo" icon={<FileArchive className="w-4 h-4" />} />
              <StatCard label="Proses" value={stats.proses} color="amber" icon={<LoaderIcon className="w-4 h-4" />} />
              <StatCard label="Review" value={stats.review} color="purple" icon={<Users className="w-4 h-4" />} />
              <StatCard label="Selesai" value={stats.selesai} color="green" icon={<CheckCircle2 className="w-4 h-4" />} />
            </div>
          )}

          {/* Forms table */}
          <Card className="shadow-sm border-slate-200 dark:border-slate-800">
            <CardHeader className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {isAdmin ? "Semua Formulir" : "Formulir Saya"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {forms.length} formulir ditemukan
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-b border-slate-100 dark:border-slate-800">
                      <SortableHead label="ID" sortKey="id" sortConfig={sortConfig} onSort={handleSort} className="w-16" />
                      {isAdmin && <SortableHead label="No. WhatsApp Klien" sortKey="assigned_wa" sortConfig={sortConfig} onSort={handleSort} />}
                      <SortableHead label="Jenis Formulir" sortKey="form_label" sortConfig={sortConfig} onSort={handleSort} />
                      <SortableHead label="Status" sortKey="status" sortConfig={sortConfig} onSort={handleSort} className="hidden md:table-cell" />
                      <SortableHead label="Dibuat" sortKey="created_at" sortConfig={sortConfig} onSort={handleSort} className="hidden lg:table-cell" />
                      <TableHead className="text-right text-xs font-semibold text-slate-500 pr-6">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isAdmin ? 6 : 5} className="text-center py-12 text-slate-400 text-sm">
                          <div className="flex flex-col items-center gap-2">
                            <FileText className="w-8 h-8 text-slate-300" />
                            Belum ada formulir
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginated.map((form) => (
                        <TableRow key={form.id} className="border-b border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                          <TableCell className="font-mono text-xs text-slate-400 pl-6">#{form.id}</TableCell>
                          {isAdmin && (
                            <TableCell className="text-sm">
                              <span className="text-slate-700 dark:text-slate-200">{form.assigned_wa}</span>
                            </TableCell>
                          )}
                          <TableCell className="text-sm font-medium text-slate-700 dark:text-slate-200">
                            {form.form_label}
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <StatusBadge status={form.status} />
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-xs text-slate-500">
                            {new Date(form.created_at).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-slate-700">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem onClick={() => setSelectedForm(form)}>
                                  <FileText className="mr-2 h-3.5 w-3.5" />Lihat Detail
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handlePreviewPdf(form)} disabled={isPdfLoading === form.slug}>
                                  {isPdfLoading === form.slug ? (
                                    <LoaderIcon className="mr-2 h-3.5 w-3.5 animate-spin text-blue-500" />
                                  ) : (
                                    <FileText className="mr-2 h-3.5 w-3.5 text-blue-500" />
                                  )}
                                  <span className="font-semibold text-blue-600 dark:text-blue-400">Preview PDF</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/form/${form.slug}`)}>
                                  <ExternalLink className="mr-2 h-3.5 w-3.5" />Buka Form
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => copyLink(form.link)}>
                                  <Copy className="mr-2 h-3.5 w-3.5" />Salin Link
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => router.push(`/filemanager/${form.slug}`)}>
                                  <Folder className="mr-2 h-3.5 w-3.5" />Dokumen
                                </DropdownMenuItem>
                                {isAdmin && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuLabel className="text-xs text-slate-400 font-normal">Ubah Status</DropdownMenuLabel>
                                    {["draft", "submitted", "proses", "review", "selesai"]
                                      .filter((s) => s !== form.status?.toLowerCase())
                                      .map((s) => (
                                        <DropdownMenuItem key={s} onClick={() => handleChangeStatus(form.slug, s)}>
                                          <StatusBadge status={s} />
                                        </DropdownMenuItem>
                                      ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      className="text-red-600 focus:text-red-600"
                                      onClick={() => setDeleteConfirm(form)}
                                    >
                                      <Trash2 className="mr-2 h-3.5 w-3.5" />Hapus Formulir
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>

            {totalPages > 1 && (
              <CardFooter className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-6 py-3">
                <p className="text-xs text-slate-500">
                  Halaman {currentPage} dari {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1} className="h-7 text-xs">
                    ← Sebelumnya
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages} className="h-7 text-xs">
                    Berikutnya →
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>


      {/* ── Detail Dialog ────────────────────────────────────────────────────── */}
      {selectedForm && (
        <Dialog open={!!selectedForm} onOpenChange={() => setSelectedForm(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detail Formulir #{selectedForm.id}</DialogTitle>
              <DialogDescription>{selectedForm.form_label}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2 text-sm">
              <DetailRow label="No. WhatsApp Klien" value={selectedForm.assigned_wa} />
              <DetailRow label="Jenis Formulir" value={selectedForm.form_label} />
              <DetailRow label="Status" value={<StatusBadge status={selectedForm.status} />} />
              <DetailRow label="Catatan" value={selectedForm.note || "–"} />
              <DetailRow
                label="Link Form"
                value={
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-slate-100 px-2 py-0.5 rounded break-all">{selectedForm.link}</code>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => copyLink(selectedForm.link)}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                }
              />
              <DetailRow
                label="Dibuat"
                value={new Date(selectedForm.created_at).toLocaleString("id-ID")}
              />
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setSelectedForm(null)}>Tutup</Button>
              <Button variant="secondary" onClick={() => handlePreviewPdf(selectedForm)} disabled={isPdfLoading === selectedForm.slug}>
                {isPdfLoading === selectedForm.slug ? (
                  <LoaderIcon className="h-4 w-4 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4 mr-1.5" />
                )}
                Preview PDF
              </Button>
              <Button onClick={() => { copyLink(selectedForm.link); }}>
                <Copy className="h-4 w-4 mr-1" />Salin Link
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Delete Dialog ────────────────────────────────────────────────────── */}
      {deleteConfirm && (
        <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Hapus Formulir?</DialogTitle>
              <DialogDescription>
                Hapus formulir #{deleteConfirm.id} untuk <b>{deleteConfirm.assigned_wa}</b>?
                Semua data terkait akan hilang permanen.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Batal</Button>
              <Button variant="destructive" onClick={handleDelete}>
                <Trash2 className="h-4 w-4 mr-1" />Hapus Permanen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function NavItem({ href, icon: Icon, label, active = false }: {
  href: string; icon: React.ElementType; label: string; active?: boolean;
}) {
  return (
    <Link href={href}>
      <Button
        variant="ghost"
        className={`w-full justify-start gap-2.5 h-9 text-sm font-medium transition-all ${
          active
            ? "bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-950 dark:text-blue-300"
            : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white"
        }`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
}

function StatCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  const colorMap: Record<string, string> = {
    blue:   "bg-blue-50 text-blue-600 border-blue-100",
    slate:  "bg-slate-50 text-slate-600 border-slate-200",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber:  "bg-amber-50 text-amber-600 border-amber-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    green:  "bg-green-50 text-green-600 border-green-100",
  };
  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium opacity-80">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function SortableHead({ label, sortKey, sortConfig, onSort, className = "" }: {
  label: string; sortKey: string; sortConfig: { key: string; direction: string };
  onSort: (k: string) => void; className?: string;
}) {
  return (
    <TableHead
      onClick={() => onSort(sortKey)}
      className={`cursor-pointer select-none text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors pl-6 ${className}`}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortConfig.key === sortKey ? (
          sortConfig.direction === "ascending" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        ) : null}
      </div>
    </TableHead>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-slate-500 w-32 shrink-0 text-xs mt-0.5">{label}</span>
      <div className="flex-1 text-slate-700 dark:text-slate-200">{value}</div>
    </div>
  );
}

const getBase64ImageFromUrl = async (url: string): Promise<string> => {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};
