"use client"; // This makes the component a Client Component

import * as React from "react"
import Image from "next/image"
import Head from 'next/head';
import { sendGTMEvent } from '@next/third-parties/google'
import Link from "next/link"
import { Star, CheckCircle, ArrowRight, BarChart2, FolderOpen, FileText, Phone, MessageCircle, Clock, Download, RefreshCw, Check, Building } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

function DashboardMockup() {
  const [activeTab, setActiveTab] = React.useState<"progress" | "documents">("progress");
  
  const currentStep = 2; // Step 3 (SK Kemenkumham) is active
  
  // Steps description for Legalitas PT
  const steps = [
    { name: "Pengisian Formulir", desc: "Data & dokumen persyaratan", status: "completed" },
    { name: "Review Dokumen", desc: "Verifikasi oleh tim legal", status: "completed" },
    { name: "SK Kemenkumham", desc: "Proses pengesahan notaris & negara", status: "active" },
    { name: "NPWP Perusahaan", desc: "Pendaftaran NPWP Badan Usaha", status: "pending" },
    { name: "Penerbitan NIB", desc: "Nomor Induk Berusaha via OSS", status: "pending" }
  ];

  // Documents list
  const documents = [
    { name: "Akta_Pendirian_PT_Maju.pdf", type: "Akta Pendirian", size: "2.4 MB", status: "selesai" },
    { name: "SK_Menkumham_Maju.pdf", type: "SK Pengesahan", size: "1.2 MB", status: "selesai" },
    { name: "NPWP_PT_Maju.pdf", type: "NPWP Badan", size: "850 KB", status: "proses" },
    { name: "NIB_PT_Maju.pdf", type: "Izin Usaha NIB", size: "---", status: "pending" }
  ];

  const getStepStatus = (index: number) => {
    if (index < currentStep) return "completed";
    if (index === currentStep) return "active";
    return "pending";
  };

  const activeProgress = ((currentStep) / 4) * 100;

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Mockup Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* OS-like circles */}
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
          </div>
          <span className="text-xs text-slate-400 font-medium ml-2 select-none">Client Portal - Dokasah</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px] py-0.5 px-2">
            Live Update
          </Badge>
        </div>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[380px] bg-slate-950">
        {/* Sidebar Info */}
        <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-start gap-4 bg-slate-900/50">
          <div className="space-y-3">
            <div>
              <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Perusahaan Anda</span>
              <h4 className="font-bold text-slate-200 mt-0.5 text-sm md:text-base">PT Maju Bersama Nusantara</h4>
              <p className="text-xs text-slate-400">Tipe: PT Umum (Mikro/Kecil)</p>
            </div>

            <div className="h-px bg-slate-800" />

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">KBLI Terpilih</span>
                <span className="font-semibold text-slate-200">62019</span>
              </div>
              <div className="p-2 bg-slate-950/50 rounded-lg border border-slate-800/60">
                <span className="text-slate-400 block text-[10px]">Notaris</span>
                <span className="font-semibold text-slate-200">Dra. Anita</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="md:col-span-8 p-4 flex flex-col justify-between">
          {/* Tab Headers */}
          <div>
            <div className="flex gap-2 border-b border-slate-800 pb-3 mb-4">
              <button
                onClick={() => setActiveTab("progress")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "progress"
                    ? "bg-primary text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                Progress Tracker
              </button>
              <button
                onClick={() => setActiveTab("documents")}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  activeTab === "documents"
                    ? "bg-primary text-white font-semibold"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                Dokumen Unduhan
              </button>
            </div>

            {/* Progress Tracker Tab */}
            {activeTab === "progress" && (
              <div className="space-y-4">
                {/* Progress Summary */}
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5 text-slate-300">
                    <span className="font-medium">Total Kemajuan Legalitas</span>
                    <span className="font-bold text-primary">{Math.round(activeProgress)}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${activeProgress}%` }}
                    />
                  </div>
                </div>

                {/* Vertical Steps */}
                <div className="space-y-3">
                  {steps.map((step, idx) => {
                    const status = getStepStatus(idx);
                    return (
                      <div key={idx} className="flex gap-3 items-start group">
                        <div className="flex flex-col items-center">
                          {status === "completed" && (
                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </div>
                          )}
                          {status === "active" && (
                            <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white ring-4 ring-primary/20 animate-pulse">
                              <Clock className="w-3 h-3" />
                            </div>
                          )}
                          {status === "pending" && (
                            <div className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-500">
                              <span className="text-[10px] font-bold">{idx + 1}</span>
                            </div>
                          )}
                          {idx < steps.length - 1 && (
                            <div className={`w-0.5 h-5 mt-1 ${status === "completed" ? "bg-emerald-500/50" : "bg-slate-800"}`} />
                          )}
                        </div>
                        <div className="flex-1 -mt-0.5">
                          <div className="flex items-center justify-between">
                            <span className={`text-xs font-semibold ${status === "completed" ? "text-slate-300" : status === "active" ? "text-primary font-bold animate-pulse" : "text-slate-500"}`}>
                              {step.name}
                            </span>
                            {status === "active" && (
                              <Badge className="bg-primary/20 text-primary border-primary/30 text-[9px] py-0 px-1.5 font-normal">
                                Sedang Diproses
                              </Badge>
                            )}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">{step.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === "documents" && (
              <div className="space-y-3">
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/30">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400">
                        <th className="p-2.5 font-semibold">Nama Berkas</th>
                        <th className="p-2.5 font-semibold text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc, idx) => {
                        let calculatedStatus = "pending";
                        let sizeLabel = "---";
                        if (idx === 0) {
                          calculatedStatus = currentStep >= 1 ? "selesai" : "proses";
                          sizeLabel = currentStep >= 1 ? "2.4 MB" : "---";
                        } else if (idx === 1) {
                          calculatedStatus = currentStep >= 2 ? "selesai" : currentStep === 1 ? "proses" : "pending";
                          sizeLabel = currentStep >= 2 ? "1.2 MB" : "---";
                        } else if (idx === 2) {
                          calculatedStatus = currentStep >= 3 ? "selesai" : currentStep === 2 ? "proses" : "pending";
                          sizeLabel = currentStep >= 3 ? "850 KB" : "---";
                        } else if (idx === 3) {
                          calculatedStatus = currentStep >= 4 ? "selesai" : currentStep === 3 ? "proses" : "pending";
                          sizeLabel = currentStep >= 4 ? "980 KB" : "---";
                        }

                        return (
                          <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-900/25 transition-colors">
                            <td className="p-2.5">
                              <div className="flex items-center gap-2">
                                <FileText className={`w-4 h-4 ${calculatedStatus === "selesai" ? "text-emerald-400" : "text-slate-500"}`} />
                                <div>
                                  <span className="font-medium block text-slate-200 truncate max-w-[150px] md:max-w-[180px]">
                                    {doc.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 block">{doc.type} • {sizeLabel}</span>
                                </div>
                              </div>
                            </td>
                            <td className="p-2.5 text-right">
                              {calculatedStatus === "selesai" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                                  Selesai
                                </span>
                              )}
                              {calculatedStatus === "proses" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                                  Diproses
                                </span>
                              )}
                              {calculatedStatus === "pending" && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-800/40 px-1.5 py-0.5 rounded border border-slate-700/30">
                                  Menunggu
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1 bg-slate-900/40 p-2 rounded-lg border border-slate-800/50 mt-2">
            <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Dokumen resmi terdaftar di database Kemenkumham & OSS Indonesia.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocumentVaultMockup() {
  const [activeFolder, setActiveFolder] = React.useState<"legal" | "tax" | "permits">("legal");

  const folders = [
    { id: "legal", name: "Akte & Kemenkumham", count: 2 },
    { id: "tax", name: "NPWP & Perpajakan", count: 2 },
    { id: "permits", name: "Izin Usaha & NIB", count: 1 }
  ];

  const initialFiles = {
    legal: [
      { name: "Salinan_Akta_Notaris_Signed.pdf", date: "16 Jun 2026", size: "2.4 MB" },
      { name: "SK_Menteri_Hukum_HAM.pdf", date: "17 Jun 2026", size: "1.1 MB" }
    ],
    tax: [
      { name: "NPWP_Badan_Usaha_Active.pdf", date: "18 Jun 2026", size: "640 KB" },
      { name: "Surat_Keterangan_Terdaftar_SKT.pdf", date: "18 Jun 2026", size: "520 KB" }
    ],
    permits: [
      { name: "NIB_Nomor_Induk_Berusaha.pdf", date: "Belum Rilis", size: "---" }
    ]
  };

  const getFiles = () => {
    return initialFiles[activeFolder];
  };

  return (
    <div className="w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col font-sans">
      {/* Mockup Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-yellow-500/80 block"></span>
            <span className="w-3 h-3 rounded-full bg-green-500/80 block"></span>
          </div>
          <span className="text-xs text-slate-400 font-medium ml-2 select-none">Brankas Dokumen Digital</span>
        </div>
        <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px] py-0.5 px-2">
          Enkripsi SSL
        </Badge>
      </div>

      {/* Main Body */}
      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[340px] bg-slate-950">
        {/* Folders List Sidebar */}
        <div className="md:col-span-5 border-b md:border-b-0 md:border-r border-slate-800 p-4 flex flex-col justify-between gap-3 bg-slate-900/40">
          <div className="space-y-3">
            <span className="text-[10px] text-primary uppercase font-bold tracking-wider mb-1">Kategori Berkas</span>
            
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setActiveFolder(folder.id as any)}
                className={`flex w-full items-center justify-between p-2.5 rounded-lg border text-left transition-all ${
                  activeFolder === folder.id
                    ? "bg-primary/15 border-primary/50 text-white font-semibold"
                    : "bg-slate-900/30 border-slate-800/80 text-slate-400 hover:bg-slate-900/85 hover:text-slate-200"
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen className={`w-4 h-4 ${activeFolder === folder.id ? "text-primary" : "text-slate-500"}`} />
                  <span className="text-xs">{folder.name}</span>
                </div>
                <Badge className={`text-[9px] py-0 px-1.5 ${activeFolder === folder.id ? "bg-primary text-white" : "bg-slate-800 text-slate-400"}`}>
                  {folder.count}
                </Badge>
              </button>
            ))}
          </div>
        </div>

        {/* Files View */}
        <div className="md:col-span-7 p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider">Isi Folder</span>
            
            <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
              {getFiles().map((file, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-900/30 border border-slate-850 hover:bg-slate-900/50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4.5 h-4.5 text-primary shrink-0" />
                    <div className="min-w-0">
                      <span className="text-xs text-slate-200 font-medium block truncate max-w-[170px] md:max-w-[190px]">
                        {file.name}
                      </span>
                      <span className="text-[9px] text-slate-500 block">{file.date} • {file.size}</span>
                    </div>
                  </div>
                  {file.size !== "---" ? (
                    <span className="text-[9px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      Tersimpan
                    </span>
                  ) : (
                    <span className="text-[9px] text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 animate-pulse">
                      Proses
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-slate-400 bg-slate-900/30 p-2.5 rounded-lg border border-slate-800/40 flex items-start gap-1.5 mt-4">
            <CheckCircle className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Semua berkas legalitas aman disimpan di Dokasah Cloud Storage & dapat diakses selamanya oleh Anda.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      <Head>
      <title>Jasa Legalitas Murah & Terpercaya - Dokasah</title>
<meta name="description" content="Butuh jasa legalitas murah? Dokasah membantu pembuatan PT, CV, izin usaha, dan dokumen hukum lainnya dengan cepat & terpercaya." />
<meta name="keywords" content="jasa legalitas, pembuatan PT, jasa pendirian CV, izin usaha, legalitas perusahaan, pengurusan izin usaha" />
<meta name="robots" content="index, follow" />
<link rel="canonical" href="https://dokasah.web.id/layanan" />

      </Head>

    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl">
            <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white">
              D
            </div>
            Dokasah
          </div>
          <nav className="hidden md:flex gap-6">
            <Link href="/" className="text-sm font-medium hover:text-primary">
              Beranda
            </Link>
            <Link href="/layanan" className="text-sm font-medium hover:text-primary">
              Layanan
            </Link>
            <Link href="/tentang-kami" className="text-sm font-medium hover:text-primary">
              Tentang Kami
            </Link>
          </nav>
          <div className="flex items-center gap-2">
          <Link
  href="/dashboard"
  onClick={() => sendGTMEvent({ event: "login-cta", value: "Login Button Clicked" })}
>
  <Button variant="outline">Login</Button>
</Link>

<Button
  onClick={() => {
    sendGTMEvent({
      event: "cta-header",
      value: "Konsultasi Layanan Dokasah",
    });

    window.open(
      "https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F",
      "_blank",
      "noopener,noreferrer"
    );
  }}
  className="group"
>
  <MessageCircle className="h-4 w-4" /> {/* Ikon Telepon */}
</Button>

          </div>
        </div>
      </header>
      <main className="flex-1">
  {/* Hero Section */}
  <section id="beranda" className="relative overflow-hidden py-12 md:py-20 lg:py-32">
    {/* Background Gradient */}
    <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-950 dark:to-indigo-950 -z-10" />
    <div className="absolute inset-0 opacity-30 -z-10">
      <div className="absolute top-1/4 left-1/4 size-96 rounded-full bg-primary/20 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
    </div>

    {/* Container */}
    <div className="container px-4 md:px-6">
      <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
        {/* Left Column: Content */}
        <div className="flex flex-col justify-center space-y-4 w-full lg:w-1/2">
          <div className="space-y-2">
            <Badge className="inline-flex bg-primary/10 text-primary border-primary/20 mb-2">
              Terpercaya & Profesional
            </Badge>
            <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
              Solusi Legalitas Terpercaya untuk Bisnis Anda
            </h1>
            <p className="max-w-[600px] text-muted-foreground md:text-xl">
              Kami menyediakan layanan legalitas komprehensif untuk membantu bisnis Anda berkembang dengan aman dan sesuai hukum.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Button
              size="lg"
              className="group w-full sm:w-auto"
              onClick={() =>
                window.open(
                  "https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20legalitas%2C%20bisa%20dibantu%3F",
                )
              }
            >
              Konsultasi Sekarang
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
            <Link href="/layanan" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full sm:w-auto">
                Lihat Layanan Kami
              </Button>
            </Link>
          </div>

          {/* Client Logos */}
          <div className="flex items-center gap-4 pt-4">
            <div className="flex -space-x-2">
              {[
                "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
                "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
                "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&h=120&q=80",
                "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
              ].map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Foto ${index + 1}`}
                  className="size-8 rounded-full border-2 border-white object-cover"
                />
              ))}
            </div>
            <div className="text-sm">
              <span className="font-bold">500+</span> Bisnis telah kami bantu
            </div>
          </div>
        </div>

        {/* Right Column: Dashboard Mockup */}
        <div className="w-full lg:w-1/2 flex items-center justify-center">
          <DashboardMockup />
        </div>
      </div>
    </div>
  </section>

        {/* Dashboard Features Section */}
        <section
          id="dashboard-features"
          className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900 dark:to-gray-800"
        >
          <div className="container px-4 md:px-6">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Fitur Unggulan</Badge>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Dashboard Manajemen Proses
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                Pantau proses legalitas Anda secara real-time dan kelola dokumen dengan mudah
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-background/60 backdrop-blur-lg">
                <CardHeader>
                  <BarChart2 className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Tracking Proses Real-time</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Pantau setiap tahap proses legalitas Anda secara langsung melalui dashboard yang intuitif.</p>
                </CardContent>
              </Card>
              <Card className="bg-background/60 backdrop-blur-lg">
                <CardHeader>
                  <FolderOpen className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>File Manager Terintegrasi</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Kelola dan akses dokumen penting Anda dengan aman dalam satu platform terpusat.</p>
                </CardContent>
              </Card>
              <Card className="bg-background/60 backdrop-blur-lg">
                <CardHeader>
                  <FileText className="h-10 w-10 text-primary mb-2" />
                  <CardTitle>Formulir Otomatis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>Isi formulir dengan mudah menggunakan sistem otomatis yang terintegrasi dengan KBLI.</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
        <section
  id="hero"
  className="py-16 md:py-24 bg-gradient-to-b from-primary to-primary/70 text-white"
>
  <div className="container px-4 md:px-6">
    <div className="text-center mb-12">
      <Badge className="mb-4 bg-white/20 text-white border-white/30">Proses Kami</Badge>
      <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
        Alur Proses yang Mudah Dipahami
      </h1>
      <p className="mt-4 text-lg text-white/80">
        Dari awal hingga akhir, ikuti langkah-langkah berikut untuk menyelesaikan proses Anda.
      </p>
    </div>

    {/* Grid Layout with Horizontal Lines */}
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Step 1 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">1</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Pengisian Formulir</h3>
          <p className="mt-2 text-white/80">
            Mulailah dengan mengisi formulir online yang mudah dan terintegrasi.
          </p>
        </div>

        {/* Horizontal Line Connector */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -z-10"></div>

        {/* Step 2 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">2</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Review oleh Tim Kami</h3>
          <p className="mt-2 text-white/80">
            Tim profesional kami akan meninjau data Anda untuk memastikan keakuratannya.
          </p>
        </div>

        {/* Horizontal Line Connector */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -z-10"></div>

        {/* Step 3 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">3</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Drafting Proses</h3>
          <p className="mt-2 text-white/80">
            Kami akan membuat draft dokumen berdasarkan data yang telah diverifikasi.
          </p>
        </div>
      </div>

      {/* Additional Steps (Optional) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {/* Step 4 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">4</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Review dari Client</h3>
          <p className="mt-2 text-white/80">
            Anda dapat meninjau draft dokumen dan memberikan feedback sebelum finalisasi.
          </p>
        </div>

        {/* Horizontal Line Connector */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -z-10"></div>

        {/* Step 5 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">5</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Pembayaran DP</h3>
          <p className="mt-2 text-white/80">
            Lakukan pembayaran uang muka (DP) untuk memulai proses penyelesaian dokumen.
          </p>
        </div>

        {/* Horizontal Line Connector */}
        <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-white/30 -z-10"></div>

        {/* Step 6 */}
        <div className="flex flex-col items-center text-center relative">
          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center z-10">
            <span className="text-primary text-xl font-bold">6</span>
          </div>
          <h3 className="mt-4 text-xl font-semibold">Proses Penyelesaian</h3>
          <p className="mt-2 text-white/80">
            Dokumen Anda akan diselesaikan sesuai dengan timeline yang disepakati.
          </p>
        </div>
      </div>
    </div>
  </div>
</section>

        {/* Why Us Section */}
        <section id="why-us" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">Mengapa Memilih Kami</Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Keunggulan Layanan Kami</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Kami menyediakan layanan pendirian legalitas dengan proses yang transparan, cepat, dan sesuai dengan
                  peraturan yang berlaku.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  title: "Proses Cepat",
                  description: "Pendirian Legalitas selesai dalam waktu 1-4 hari kerja dengan dokumen lengkap",
                },
                {
                  title: "Tim Profesional",
                  description: "Didukung oleh tim legal yang berpengalaman dan profesional",
                },
                {
                  title: "Harga Transparan",
                  description: "Tidak ada biaya tersembunyi, semua sudah termasuk dalam paket",
                },
                {
                  title: "Konsultasi Gratis",
                  description: "Dapatkan konsultasi gratis sebelum memulai proses pendirian PT",
                },
                {
                  title: "Pendampingan Penuh",
                  description: "Kami mendampingi Anda dari awal hingga PT Anda berdiri",
                },
                {
                  title: "Dokumen Legal",
                  description: "Semua dokumen yang kami proses legal dan sesuai peraturan",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="group relative overflow-hidden border bg-background/50 backdrop-blur-sm transition-all hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
                  <CardHeader>
                    <CardTitle>{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">{item.description}</CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="tentang" className="relative overflow-hidden bg-muted py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-950/50 dark:to-indigo-950/50 -z-10" />
          <div className="absolute inset-0 opacity-30 -z-10">
            <div className="absolute top-1/3 right-1/3 size-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-1/3 left-1/3 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="bg-primary/10 text-primary border-primary/20">Tentang Kami</Badge>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Berpengalaman Dalam Bidang Legalitas Perusahaan
                  </h2>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
                    Kami adalah tim profesional yang berpengalaman dalam bidang legalitas perusahaan. Kami telah
                    membantu ratusan perusahaan untuk mendirikan legalitas dengan proses yang mudah dan cepat.
                  </p>
                </div>
                <ul className="grid gap-2">
                  {[
                    "Berpengalaman lebih dari 5 tahun",
                    "Telah membantu 500+ perusahaan",
                    "Tim legal profesional",
                    "Proses transparan dan terpercaya",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="size-5 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="w-full flex items-center justify-center">
                <DocumentVaultMockup />
              </div>
            </div>
          </div>
        </section>

{/* Services Section */}
<section id="layanan" className="py-16 md:py-24">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-4 text-center">
      <div className="space-y-2">
        <Badge className="bg-primary/10 text-primary border-primary/20">Layanan Kami</Badge>
        <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Layanan Dokasah</h2>
        <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
          Kami menyediakan berbagai layanan legalitas untuk membantu bisnis Anda berkembang dengan aman dan legal.
        </p>
      </div>
      {/* Tombol Cek Semua Layanan */}
<div className="flex justify-center mt-8">
<a
    href="/layanan"
    className="px-8 py-3 text-lg font-semibold bg-primary text-white rounded-md shadow-md hover:bg-primary/80 flex items-center gap-2 group"
    onClick={() => sendGTMEvent({ event: "Layanan", value: "Cek Semua Layanan Kami" })}
  >
    Cek Semua Layanan Kami
    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
  </a>

</div>
    </div>
    <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
      {[
        {
          title: "Pendirian PT Umum",
          price: "Rp 3.500.000",
          description: "Paket pendirian PT dengan kelengkapan legalitas & Bonus",
          popular: true,
          nego: true,
          reviews: 1955,
          features: [
            "Akta Pendirian (Notaris) & SK Menkumham",
            "NPWP PT & SKT",
            "NIB",
            "Sertifikasi standar (Tergantung usaha)",
            "Tata Ruang, SPPL & K3L",
            "Username dan password OSS",
            "Design Logo, Kop surat, Kartu nama"
          ],
        },
        {
          title: "Pendirian PT Perorangan",
          price: "Rp 459.000",
          description: "Paket pendirian PT Perorangan dengan proses cepat",
          popular: false,
          nego: true,
          reviews: 699,
          features: [
            "SK Menkumham",
            "NPWP PT & SKT",
            "NIB",
            "Sertifikasi standar (Tergantung usaha)",
            "Tata Ruang, SPPL & K3L",
            "Username dan password OSS & AHU",
            "Design Logo, Kop surat, Kartu nama"
          ],
        },
        {
          title: "Pendirian CV",
          price: "Rp 3.000.000",
          description: "Paket pendirian CV dengan dokumen lengkap",
          popular: false,
          nego: true,
          reviews: 444,
          features: [
            "Akta Pendirian (Notaris) & SK Menkumham",
            "NPWP PT & SKT",
            "NIB",
            "Sertifikasi standar (Tergantung usaha)",
            "Tata Ruang, SPPL & K3L",
            "Username dan password OSS",
            "Design Logo, Kop surat, Kartu nama"
          ],
        },
        {
          title: "Pendirian Yayasan",
          price: "Rp 3.500.000",
          description: "Paket pendirian Yayasan dengan dokumen lengkap",
          popular: false,
          nego: true,
          reviews: 367,
          features: [
            "Akta Pendirian (Notaris) & SK Menkumham",
            "NPWP PT & SKT",
            "NIB",
            "Sertifikasi standar (Tergantung usaha)",
            "Tata Ruang, SPPL & K3L",
            "Username dan password OSS",
            "Design Logo, Kop surat, Kartu nama"
          ],
        },
        {
          title: "NIB PERORANGAN",
          price: "Rp 150.000",
          description: "Layanan pengurusan izin usaha NIB perorangan",
          popular: false,
          reviews: 455,
          features: [
            "Nomor Induk Izin Berusaha (NIB)",
            "Lampiran Perizinan Berusaha",
            "Tata Ruang, K3L & SPPL",
            "Username dan password untuk cek keaslian legalitas",
            "Kode Akses Masuk Aplikasi Perizinan OSS",
          ],
        },
        {
          title: "Perizinan Usaha (NIB BADAN)",
          price: "Rp 450.000",
          description: "Layanan pengurusan izin usaha NIB Badan seperti PT, CV, YAYASAN, dll",
          popular: false,
          reviews: 855,
          features: [
            "Nomor Induk Izin Berusaha (NIB)",
            "Lampiran Perizinan Berusaha",
            "Tata Ruang, K3L & SPPL",
            "Username dan password untuk cek keaslian legalitas",
            "Kode Akses Masuk Aplikasi Perizinan OSS",
          ],
        },
      ].map((service, i) => (
        <Card
  key={i}
  className="relative overflow-hidden border bg-background/50 backdrop-blur-sm transition-all hover:shadow-md"
>
  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 pointer-events-none transition-opacity hover:opacity-100" />
  <CardHeader>
  <div className="flex gap-2">
  {service.popular && (
    <Badge className="w-fit mb-2 text-white">Terlaris</Badge>
  )}
  {service.nego && (
    <Badge className="w-fit mb-2 bg-green-500 text-white">Bisa Nego</Badge>
  )}
</div>

    <CardTitle>{service.title}</CardTitle>
    <div className="flex items-center gap-1">
      {Array(5)
        .fill(0)
        .map((_, i) => (
          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
        ))}
      <span className="text-sm text-muted-foreground">({service.reviews} Review)</span>
    </div>
  </CardHeader>
  <CardContent className="space-y-4">
    <div>
      <span className="text-3xl font-bold">{service.price}</span>
    </div>
    <p className="text-muted-foreground">{service.description}</p>
    <div className="space-y-2">
      <h4 className="font-medium">Termasuk:</h4>
      <ul className="space-y-1">
        {service.features.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <CheckCircle className="size-4 text-primary" />
            <span className="text-sm">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  </CardContent>
  <CardFooter>
  <button
        className="w-full px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/80"
        onClick={() => {
          sendGTMEvent({ event: "CTA", value: `Hubungi Kami - ${service.title}` });
          window.open(
            `https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20tentang%20${encodeURIComponent(service.title)}`,
            "_blank",
            "noopener,noreferrer"
          );
        }}
      >
        Hubungi Kami
      </button>
  </CardFooter>
</Card>

      ))}
    </div>
  </div>
</section>


        {/* Testimonials Section */}
        <section id="testimonials" className="relative overflow-hidden bg-muted py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-slate-950/50 dark:to-indigo-950/50 -z-10" />
          <div className="absolute inset-0 opacity-30 -z-10">
            <div className="absolute top-1/4 right-1/4 size-96 rounded-full bg-primary/20 blur-3xl" />
            <div className="absolute bottom-1/4 left-1/4 size-96 rounded-full bg-indigo-400/20 blur-3xl" />
          </div>
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">Testimonial</Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Apa Kata Klien Kami</h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Lihat apa yang dikatakan klien kami tentang layanan pendirian PT yang kami berikan.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  name: "Budi Santoso",
                  company: "PT Sukses Mitra Jaya",
                  testimonial:
                    "Proses pendirian PT sangat cepat dan profesional. Semua dokumen lengkap dan sesuai dengan peraturan yang berlaku.",
                },
                {
                  name: "Dewi Lestari",
                  company: "PT Kenari Indo Farma",
                  testimonial:
                    "Sangat puas dengan layanan yang diberikan. Tim sangat responsif dan membantu dari awal hingga akhir proses.",
                },
                {
                  name: "Ahmad Hidayat",
                  company: "CV Karya Bangsa Utama",
                  testimonial:
                    "Harga transparan dan tidak ada biaya tersembunyi. Proses cepat dan dokumen lengkap. Sangat direkomendasikan!",
                },
              ].map((item, i) => (
                <Card
                  key={i}
                  className="relative overflow-hidden border bg-background/50 backdrop-blur-sm transition-all hover:shadow-md"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 transition-opacity hover:opacity-100" />
                  <CardHeader>
                    <div className="flex items-center gap-1 mb-2">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                        ))}
                    </div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription>{item.company}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">"{item.testimonial}"</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
<section id="kontak" className="py-16 md:py-24">
  <div className="container px-4 md:px-6">
    <div className="flex flex-col items-center justify-center space-y-6 text-center">
      {/* Badge */}
      <Badge className="bg-primary/10 text-primary border-primary/20">Mulai Sekarang</Badge>

      {/* Heading */}
      <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
        Siap Untuk Buat Bisnis-mu Legal?
      </h2>

      {/* Description */}
      <p className="max-w-[600px] text-muted-foreground md:text-xl/relaxed">
        Hubungi kami sekarang untuk konsultasi gratis dan mulai proses pendirian & berkaitan dengan legalitas Anda dengan mudah dan cepat.
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
      <Button
  size="lg"
  className="group"
  onClick={() => {
    sendGTMEvent({ event: "konsultasi-cta", value: "Hubungi Kami - Legalitas" });

    window.open(
      "https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20tentang%20pendirian%20Legalitas%2C%20bisa%20dibantu%3F",
      "_blank",
      "noopener,noreferrer"
    );
  }}
>
  Hubungi Kami
  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
</Button>
<Button
  size="lg"
  variant="outline"
  onClick={() => {
    sendGTMEvent({ event: "konsultasi-gratis", value: "Konsultasi Gratis - Legalitas" });

    window.open(
      "https://wa.me/6287767518217?text=Saya%20ingin%20konsultasi%20gratis%20tentang%20pendirian%20Legalitas%2C%20bisa%20dibantu%3F",
      "_blank",
      "noopener,noreferrer"
    );
  }}
>
  Konsultasi Gratis
</Button>
      </div>
    </div>
  </div>
</section>
      </main>
      <footer className="border-t bg-muted/40 backdrop-blur-sm">
        <div className="container flex flex-col gap-6 py-8 md:py-12">
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-bold text-xl">
                <div className="size-8 rounded-full bg-gradient-to-br from-primary to-primary-foreground flex items-center justify-center text-white">
                  D
                </div>
                Dokasah
              </div>
              <p className="text-sm text-muted-foreground">
                Jasa pendirian PT dan layanan legalitas perusahaan terpercaya di Indonesia.
              </p>
              <div className="flex gap-2">
                <Link
                  href="https://www.facebook.com/profile.php?id=100095648193688"
                  className="size-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-facebook"
                  >
                    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                  </svg>
                  <span className="sr-only">Facebook</span>
                </Link>
                <Link
                  href="#"
                  className="size-8 flex items-center justify-center rounded-full bg-muted hover:bg-muted/80"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-instagram"
                  >
                    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
                  </svg>
                  <span className="sr-only">Instagram</span>
                </Link>
              </div>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Layanan Kami</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/layanan" className="text-sm text-muted-foreground hover:text-foreground">
                    Semua Layanan Kami
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Perusahaan</h3>
              <ul className="space-y-1">
                <li>
                  <Link href="/tentang-kami" className="text-sm text-muted-foreground hover:text-foreground">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-sm text-muted-foreground hover:text-foreground">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium">Kontak</h3>
              <ul className="space-y-1">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-map-pin"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span>Kedung Pengawas, Kec. Babelan, Kabupaten Bekasi, Jawa Barat 17610, Indonesia</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-phone"
                  >
                    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                  </svg>
                  <span>+62 877-6751-8217</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="lucide lucide-mail"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  <span>dokasahcare@gmail.com</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Dokasah. Hak Cipta Dilindungi.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Syarat & Ketentuan
              </Link>
              <Link href="#" className="text-xs text-muted-foreground hover:text-foreground">
                Kebijakan Privasi
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
    </>
  )
}

