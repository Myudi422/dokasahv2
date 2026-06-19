"use client";

import * as React from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard, FileText, Folder, LogOut, Menu, MoreHorizontal,
  FileArchive, LoaderIcon, Users, ChevronUp, ChevronDown, Plus,
  CheckCircle2, Clock, AlertCircle, TrendingUp, Copy, ExternalLink,
  NotepadText, Trash2, RefreshCw, Calendar, Filter, Search, MessageCircle,
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
  const [searchQuery, setSearchQuery] = React.useState("");
  const [dateFilter, setDateFilter] = React.useState<"all" | "today">("all");
  const [invoiceModalOpen, setInvoiceModalOpen] = React.useState(false);
  const [invoiceForm, setInvoiceForm] = React.useState({
    number: "",
    description: "",
    nominal: "",
    notes: "Pembayaran telah diterima dan divalidasi. Terima kasih.",
    status: "LUNAS",
  });
  const [invoiceTargetForm, setInvoiceTargetForm] = React.useState<FormItem | null>(null);
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
  const filteredForms = React.useMemo(() => {
    let result = [...forms];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (form) =>
          form.assigned_wa?.toLowerCase().includes(q) ||
          form.form_label?.toLowerCase().includes(q) ||
          form.slug?.toLowerCase().includes(q) ||
          form.id?.toString().includes(q)
      );
    }

    // Date filter
    if (dateFilter === "today") {
      const today = new Date();
      result = result.filter((form) => {
        const d = new Date(form.created_at);
        return (
          d.getDate() === today.getDate() &&
          d.getMonth() === today.getMonth() &&
          d.getFullYear() === today.getFullYear()
        );
      });
    }

    return result;
  }, [forms, searchQuery, dateFilter]);

  const sortedForms = React.useMemo(() => {
    const sorted = [...filteredForms];
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
  }, [filteredForms, sortConfig]);

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

  const openInvoiceModal = (form: FormItem) => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    setInvoiceTargetForm(form);
    setInvoiceForm({
      number: `INV/${dateStr}/${form.id}`,
      description: `Biaya Pengisian & Administrasi - ${form.form_label}`,
      nominal: "150000",
      notes: "Pembayaran telah diterima dan divalidasi. Terima kasih.",
      status: "LUNAS",
    });
    setInvoiceModalOpen(true);
  };

  const handleGenerateInvoicePdf = async () => {
    if (!invoiceTargetForm) return;
    try {
      const { default: jsPDF } = await import("jspdf");
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const width = doc.internal.pageSize.getWidth();
      const height = doc.internal.pageSize.getHeight();

      let wmBase64 = "";
      try {
        wmBase64 = await getBase64ImageFromUrl("/b2-assets/dokasah/wm.jpg");
      } catch (err) {
        console.error("Gagal memuat watermark:", err);
      }

      if (wmBase64) {
        doc.addImage(wmBase64, "JPEG", 0, 0, width, height);
      }

      const margin = 20;
      const contentWidth = width - (margin * 2);
      let currentY = 64;

      // Invoice Document Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(30, 58, 138);
      doc.text("INVOICE", margin, currentY);

      // Status Badge paid/lunas/dp/belum bayar/batal
      let badgeText = invoiceForm.status;
      let badgeBg = [220, 252, 231]; // default light green
      let badgeTextClr = [21, 128, 61]; // default dark green
      let badgeW = 25;

      if (invoiceForm.status === "DP") {
        badgeBg = [254, 243, 199]; // Amber bg
        badgeTextClr = [180, 83, 9]; // Amber text
        badgeText = "DP / DEPOSIT";
        badgeW = 32;
      } else if (invoiceForm.status === "BELUM BAYAR") {
        badgeBg = [254, 226, 226]; // Red bg
        badgeTextClr = [185, 28, 28]; // Red text
        badgeText = "BELUM BAYAR";
        badgeW = 32;
      } else if (invoiceForm.status === "BATAL") {
        badgeBg = [241, 245, 249]; // Gray bg
        badgeTextClr = [71, 85, 105]; // Gray text
        badgeText = "BATAL";
        badgeW = 20;
      }

      doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
      doc.roundedRect(width - margin - badgeW, currentY - 6, badgeW, 8, 2, 2, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(badgeTextClr[0], badgeTextClr[1], badgeTextClr[2]);

      const textWidth = doc.getTextWidth(badgeText);
      const textX = width - margin - badgeW + (badgeW - textWidth) / 2;
      doc.text(badgeText, textX, currentY - 0.5);

      currentY += 12;

      // Draw horizontal separator
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, width - margin, currentY);

      currentY += 8;

      // Metadata Info
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text("No. Invoice:", margin, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(invoiceForm.number, margin + 22, currentY);

      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Tanggal:", margin, currentY + 6);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(
        new Date().toLocaleDateString("id-ID", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        margin + 22,
        currentY + 6
      );

      // Ditujukan Kepada
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Ditujukan Kepada:", margin + 95, currentY);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      doc.text(invoiceTargetForm.assigned_wa, margin + 95, currentY + 6);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(100, 116, 139);
      doc.text(`Formulir: ${invoiceTargetForm.form_label}`, margin + 95, currentY + 11);

      currentY += 22;

      // Table Header for Invoice Item
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, currentY, contentWidth, 8, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text("DESKRIPSI LAYANAN / PRODUK", margin + 4, currentY + 5.5);
      doc.text("TOTAL", width - margin - 35, currentY + 5.5);

      currentY += 12;

      // Table Row Item
      doc.setFont("helvetica", "normal");
      doc.setTextColor(15, 23, 42);
      const descLines = doc.splitTextToSize(invoiceForm.description, contentWidth - 45);
      doc.text(descLines, margin + 4, currentY);

      // Format price
      const priceVal = parseFloat(invoiceForm.nominal) || 0;
      const formattedPrice = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(priceVal);

      doc.setFont("helvetica", "bold");
      doc.text(formattedPrice, width - margin - 35, currentY);

      const rowHeight = Math.max(descLines.length * 4.5, 8);
      currentY += rowHeight;

      // Draw subtotal separator line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, width - margin, currentY);

      currentY += 6;

      // Subtotal & Total
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Total Pembayaran:", width - margin - 75, currentY);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(30, 58, 138);
      doc.text(formattedPrice, width - margin - 35, currentY);

      currentY += 15;

      // --- Payment Method Section ---
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(30, 58, 138);
      doc.text("METODE PEMBAYARAN", margin, currentY);

      // Section separator line
      currentY += 2.5;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.3);
      doc.line(margin, currentY, width - margin, currentY);
      currentY += 4.5;

      // Generate & add QR Code image
      const QRCode = await import("qrcode");
      const qrCodeUrl = "https://app.midtrans.com/payment-links/payment-dokasah-FQw4D0TX";
      const qrDataUrl = await QRCode.toDataURL(qrCodeUrl, { margin: 1, scale: 4 });
      doc.addImage(qrDataUrl, "PNG", margin, currentY, 28, 28);

      // Text details next to QR Code
      const detailX = margin + 33;
      let textY = currentY + 3;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("1. Scan QR Code atau klik link di bawah:", detailX, textY);

      textY += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(37, 99, 235); // Blue link color
      doc.textWithLink("Bayar via Midtrans (Klik di sini)", detailX, textY, { url: qrCodeUrl });

      textY += 5.5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(15, 23, 42);
      doc.text("2. Atau Transfer Manual:", detailX, textY);

      textY += 4;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(51, 65, 85);
      doc.text("Bank BCA: 7402325413 a/n MUHAMAD RIZKI WAHYUDI", detailX, textY);

      textY += 4;
      doc.text("Bank Jago: 501558209000 a/n MUHAMAD RIZKI WAHYUDI", detailX, textY);

      textY += 5;
      doc.setFont("helvetica", "bolditalic");
      doc.setFontSize(7.5);
      doc.setTextColor(220, 38, 38); // Red color for security warning
      doc.text("PENTING: Selain dari rekening di atas, itu bukan dari pihak Dokasah.", detailX, textY);

      currentY += 32;

      // Notes section
      if (invoiceForm.notes) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(71, 85, 105);
        doc.text("Catatan:", margin, currentY);
        doc.setFont("helvetica", "italic");
        doc.setTextColor(100, 116, 139);
        const notesLines = doc.splitTextToSize(invoiceForm.notes, contentWidth - 10);
        doc.text(notesLines, margin, currentY + 5);
      }

      // Handle PDF Output (New Tab / Direct Download on Mobile)
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        doc.save(`Invoice_${invoiceForm.number.replace(/\//g, "_")}.pdf`);
      } else {
        const pdfUrl = doc.output("bloburl");
        window.open(pdfUrl, "_blank");
      }

      // Close modal
      setInvoiceModalOpen(false);
    } catch (err) {
      console.error("Gagal membuat PDF invoice:", err);
      alert("Gagal membuat PDF Invoice. Silakan coba lagi.");
    }
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
            const isUploadedFile = field.type === "file" && rawVal;
            let displayVal = "–";

            if (field.type === "file") {
              displayVal = rawVal ? "Download Disini" : "BELUM DIUNGGAH";
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

            if (isUploadedFile) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(37, 99, 235); // Blue link
              doc.textWithLink("Download Disini", margin + 48, currentY, { url: rawVal });
            } else {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9);
              doc.setTextColor(15, 23, 42);
              doc.text(valueLines, margin + 48, currentY);
            }

            currentY += rowHeight;
          }

          currentY += 6;
        }
      }

      // On mobile, download directly, on desktop open in new tab
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        doc.save(`Formulir_${formItem.slug}.pdf`);
      } else {
        const pdfUrl = doc.output("bloburl");
        window.open(pdfUrl, "_blank");
      }
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
            <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-850">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="text-base font-semibold">
                    {isAdmin ? "Semua Formulir" : "Formulir Saya"}
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Menampilkan {filteredForms.length} dari {forms.length} formulir
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Search bar */}
                  <div className="relative w-full sm:w-60">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nomor WA, jenis form..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-850 bg-slate-50 dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100 placeholder-slate-400"
                    />
                  </div>

                  {/* Filter Date Button Group */}
                  <div className="flex items-center rounded-xl border border-slate-200 dark:border-slate-800 p-0.5 bg-slate-50 dark:bg-slate-900">
                    <button
                      onClick={() => {
                        setDateFilter("all");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                        dateFilter === "all"
                          ? "bg-white dark:bg-slate-850 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      Semua
                    </button>
                    <button
                      onClick={() => {
                        setDateFilter("today");
                        setCurrentPage(1);
                      }}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all flex items-center gap-1 ${
                        dateFilter === "today"
                          ? "bg-white dark:bg-slate-855 text-slate-900 dark:text-white shadow-sm"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Hari Ini
                    </button>
                  </div>

                  {/* Sort selector */}
                  <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-2 bg-slate-50 dark:bg-slate-900 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300"
                    onClick={() => {
                      handleSort("created_at");
                    }}
                  >
                    <Filter className="w-3.5 h-3.5 text-slate-400" />
                    <span>Dibuat: {sortConfig.direction === "descending" ? "Terbaru" : "Terlama"}</span>
                    {sortConfig.direction === "ascending" ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {paginated.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-sm">
                  <div className="flex flex-col items-center gap-3">
                    <FileText className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    <span className="font-medium">Belum ada formulir ditemukan</span>
                    <p className="text-xs text-slate-500 max-w-xs">
                      Tidak ada formulir yang sesuai dengan pencarian atau filter tanggal Anda.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {paginated.map((form) => (
                    <div
                      key={form.id}
                      className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-slate-900/50 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 hover:border-slate-200 dark:hover:border-slate-700 transition-all shadow-sm hover:shadow-md"
                    >
                      {/* Left side info */}
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold border border-blue-100/50 dark:border-blue-900/30">
                          #{form.id}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
                              {form.form_label}
                            </h3>
                            <StatusBadge status={form.status} />
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400 pt-0.5">
                            {isAdmin && (
                              <div className="flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-medium text-slate-700 dark:text-slate-300">{form.assigned_wa}</span>
                                <a
                                  href={`https://wa.me/${form.assigned_wa.replace(/\D/g, "").replace(/^0/, "62")}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center w-5 h-5 rounded bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-450 hover:bg-emerald-100 transition-colors"
                                  title="Hubungi Klien via WhatsApp"
                                >
                                  <MessageCircle className="w-3 w-3 fill-emerald-600/10" />
                                </a>
                              </div>
                            )}
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>
                                {new Date(form.created_at).toLocaleDateString("id-ID", {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right side actions */}
                      <div className="flex items-center justify-between md:justify-end gap-2 border-t md:border-t-0 border-slate-100 dark:border-slate-800 pt-3 md:pt-0">
                        {/* Mobile preview shortcut */}
                        <div className="md:hidden">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                            ID: {form.slug.substring(0, 8)}...
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-blue-600 hover:text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/20 text-xs font-semibold"
                            onClick={() => setSelectedForm(form)}
                          >
                            Lihat Detail
                          </Button>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 rounded-lg">
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
                              <DropdownMenuItem onClick={() => openInvoiceModal(form)}>
                                <FileText className="mr-2 h-3.5 w-3.5 text-emerald-500" />
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Buat Invoice</span>
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
          <DialogContent className="sm:max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6">
            <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-100/50 dark:border-blue-900/30">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                  Detail Formulir #{selectedForm.id}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                  {selectedForm.form_label}
                </DialogDescription>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-b border-slate-100 dark:border-slate-800 text-xs sm:text-sm">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  No. WhatsApp Klien
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedForm.assigned_wa}</p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Status Formulir
                </span>
                <div className="pt-0.5">
                  <StatusBadge status={selectedForm.status} />
                </div>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Jenis Formulir
                </span>
                <p className="font-semibold text-slate-800 dark:text-slate-200">{selectedForm.form_label}</p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Catatan Admin
                </span>
                <p className="text-slate-655 dark:text-slate-350 italic bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-900 leading-relaxed">
                  {selectedForm.note || "Tidak ada catatan."}
                </p>
              </div>
              <div className="space-y-1 col-span-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Tautan / Link Formulir
                </span>
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-950 p-2 rounded-xl border border-slate-100 dark:border-slate-900">
                  <code className="text-xs text-blue-600 dark:text-blue-400 font-mono break-all flex-1">{selectedForm.link}</code>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-450 hover:text-slate-650 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => copyLink(selectedForm.link)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Tanggal Dibuat
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {new Date(selectedForm.created_at).toLocaleString("id-ID", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit"
                  })}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500 block">
                  Terakhir Diperbarui
                </span>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  {selectedForm.last_updated
                    ? new Date(selectedForm.last_updated).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })
                    : "Belum pernah diperbarui"}
                </p>
              </div>
            </div>

            <DialogFooter className="flex flex-wrap items-center justify-end gap-2 pt-4">
              <Button variant="outline" className="rounded-xl text-xs h-9" onClick={() => setSelectedForm(null)}>
                Tutup
              </Button>
              <Button
                variant="outline"
                className="rounded-xl border-emerald-600 text-emerald-600 dark:border-emerald-500 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 text-xs h-9"
                onClick={() => {
                  setSelectedForm(null);
                  openInvoiceModal(selectedForm);
                }}
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Buat Invoice
              </Button>
              <Button
                variant="secondary"
                className="rounded-xl text-xs h-9"
                onClick={() => handlePreviewPdf(selectedForm)}
                disabled={isPdfLoading === selectedForm.slug}
              >
                {isPdfLoading === selectedForm.slug ? (
                  <LoaderIcon className="h-3.5 w-3.5 mr-1.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                )}
                Preview PDF
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

      {/* ── Invoice Dialog ────────────────────────────────────────────────────── */}
      {invoiceModalOpen && invoiceTargetForm && (
        <Dialog open={invoiceModalOpen} onOpenChange={setInvoiceModalOpen}>
          <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Buat Invoice Pembayaran
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
                Lengkapi data invoice untuk formulir #{invoiceTargetForm.id} ({invoiceTargetForm.form_label})
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-3">
              {/* Nomor Invoice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nomor Invoice
                </label>
                <input
                  type="text"
                  value={invoiceForm.number}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, number: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100"
                />
              </div>

              {/* Deskripsi Invoice */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Deskripsi Invoice / Item
                </label>
                <textarea
                  value={invoiceForm.description}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100"
                />
              </div>

              {/* Nominal Pembayaran */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Nominal (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-slate-400 font-medium">Rp</span>
                  <input
                    type="number"
                    value={invoiceForm.nominal}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, nominal: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100"
                    placeholder="Contoh: 150000"
                  />
                </div>
              </div>

              {/* Status Pembayaran */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Status Invoice
                </label>
                <select
                  value={invoiceForm.status}
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    let defaultNote = invoiceForm.notes;
                    if (newStatus === "LUNAS") {
                      defaultNote = "Pembayaran telah diterima dan divalidasi. Terima kasih.";
                    } else if (newStatus === "DP") {
                      defaultNote = "Pembayaran uang muka (DP) telah diterima. Silakan lunasi sisa pembayaran.";
                    } else if (newStatus === "BELUM BAYAR") {
                      defaultNote = "Tagihan belum dibayar. Silakan lakukan pembayaran agar dapat segera diproses.";
                    } else if (newStatus === "BATAL") {
                      defaultNote = "Invoice ini telah dibatalkan.";
                    }
                    setInvoiceForm({ ...invoiceForm, status: newStatus, notes: defaultNote });
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100 font-medium"
                >
                  <option value="LUNAS">LUNAS</option>
                  <option value="DP">DP (DEPOSIT)</option>
                  <option value="BELUM BAYAR">BELUM BAYAR</option>
                  <option value="BATAL">BATAL</option>
                </select>
              </div>

              {/* Catatan / Keterangan */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Catatan
                </label>
                <textarea
                  value={invoiceForm.notes}
                  onChange={(e) => setInvoiceForm({ ...invoiceForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-955 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all dark:text-slate-100"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button variant="outline" onClick={() => setInvoiceModalOpen(false)}>
                Batal
              </Button>
              <Button 
                onClick={handleGenerateInvoicePdf}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
              >
                Cetak & Generate Invoice
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
