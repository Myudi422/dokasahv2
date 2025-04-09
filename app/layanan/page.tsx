"use client"; // This makes the component a Client Component

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Star, MessageCircle } from "lucide-react";
import { sendGTMEvent } from "@next/third-parties/google";
import Testimonisection from '@/components/testimonisection';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("legalitas");

  const legalitasServices = [
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
        "Design Logo, Kop surat, Kartu nama",
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
        "Design Logo, Kop surat, Kartu nama",
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
        "Design Logo, Kop surat, Kartu nama",
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
        "Design Logo, Kop surat, Kartu nama",
      ],
    },
    {
      title: "Pendirian Koperasi",
      price: "Rp 4.800.000",
      description: "Paket pendirian Koperasi dengan dokumen lengkap",
      popular: false,
      nego: true,
      reviews: 50,
      features: [
        "Akta Pendirian (Notaris) & SK Menkumham",
        "NPWP PT & SKT",
        "NIB",
        "Sertifikasi standar (Tergantung usaha)",
        "Tata Ruang, SPPL & K3L",
        "Username dan password OSS",
        "Design Logo, Kop surat, Kartu nama",
      ],
    },
    {
      title: "Pendirian Perkumpulan",
      price: "Rp 3.200.000",
      description: "Paket pendirian Perkumpulan dengan dokumen lengkap",
      popular: false,
      nego: true,
      reviews: 50,
      features: [
        "Akta Pendirian (Notaris) & SK Menkumham",
        "NPWP PT & SKT",
        "NIB",
        "Sertifikasi standar (Tergantung usaha)",
        "Tata Ruang, SPPL & K3L",
        "Username dan password OSS",
        "Design Logo, Kop surat, Kartu nama",
      ],
    },
    {
      title: "Pendirian Figma",
      price: "Rp 3.500.000",
      description: "Paket pendirian Figma dengan dokumen lengkap",
      popular: false,
      nego: true,
      reviews: 50,
      features: [
        "Akta Pendirian (Notaris) & SK Menkumham",
        "NPWP PT & SKT",
        "NIB",
        "Sertifikasi standar (Tergantung usaha)",
        "Tata Ruang, SPPL & K3L",
        "Username dan password OSS",
        "Design Logo, Kop surat, Kartu nama",
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
      description:
        "Layanan pengurusan izin usaha NIB Badan seperti PT, CV, YAYASAN, dll",
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
  ];

  const websiteServices = [
    {
      title: "Paket Pembuatan Website",
      price: "Rp 600.000,00",
      description: "Paket pembuatan website Standart",
      popular: true,
      nego: false,
      reviews: 0,
      features: [
        "Include Website domain .com",
        "Gratis server 1 tahun",
        "Gratis biaya perawatan & konsultasi",
        "Bebas Pilih Template Premium.",
        "Bebas pilih niche, (halaman 2-5)",
        "Web menggunakan wordpress.",
      ],
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-lg">
        <div className="container flex h-16 items-center justify-between px-4 md:px-6">
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
            <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Button
              onClick={() =>
                window.open(
                  "https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F"
                )
              }
              className="group"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section id="layanan" className="py-16 md:py-24">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  Layanan Kami
                </Badge>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Layanan Dokasah
                </h2>
                <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Kami menyediakan berbagai layanan untuk membantu bisnis Anda berkembang dengan aman dan legal.
                </p>
              </div>
              {/* Tab Bar */}
              <div className="flex justify-center mt-6 space-x-4">
                <button
                  onClick={() => setActiveTab("legalitas")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "legalitas"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  Legalitas
                </button>
                <button
                  onClick={() => setActiveTab("website")}
                  className={`px-4 py-2 border-b-2 transition-colors ${
                    activeTab === "website"
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground"
                  }`}
                >
                  Website
                </button>
              </div>
            </div>
            {/* Konten berdasarkan tab */}
            {activeTab === "legalitas" ? (
              <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                {legalitasServices.map((service, i) => (
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
                      {service.reviews > 0 && (
                        <div className="flex items-center gap-1">
                          {Array(5)
                            .fill(0)
                            .map((_, i) => (
                              <Star key={i} className="size-4 fill-yellow-400 text-yellow-400" />
                            ))}
                          <span className="text-sm text-muted-foreground">
                            ({service.reviews} Review)
                          </span>
                        </div>
                      )}
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
                          sendGTMEvent({
                            event: "CTA",
                            value: `Hubungi Kami - ${service.title}`,
                          });
                          window.open(
                            `https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20${encodeURIComponent(
                              service.title
                            )}`,
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
            ) : (
              <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
                {websiteServices.map((service, i) => (
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
                          sendGTMEvent({
                            event: "CTA",
                            value: `Hubungi Kami - ${service.title}`,
                          });
                          window.open(
                            `https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20${encodeURIComponent(
                              service.title
                            )}`,
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
            )}
          </div>
        </section>
        <Testimonisection />
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/40 backdrop-blur-sm">
        <div className="container flex flex-col gap-6 py-8 md:py-12 px-4 md:px-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-muted-foreground">
              &copy; {new Date().getFullYear()} Legalitas. Hak Cipta Dilindungi.
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
  );
}
