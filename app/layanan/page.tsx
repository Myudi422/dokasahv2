"use client"; // This makes the component a Client Component

import Link from "next/link"
import { CheckCircle, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function ServicesPage() {
  const services = [
    {
      title: "Pendirian PT Umum",
      price: "Rp 2.900.000",
      description: "Paket pendirian PT dengan kelengkapan legalitas",
      popular: true,
      reviews: 120,
      features: [
        "Akta Pendirian",
        "SK Menkumham",
        "NPWP & SKT",
        "NIB",
        "Surat Izin",
        "Tata Ruang",
        "Sertifikasi standar (Tergantung usaha)",
        "SPPL",
        "K3L",
        "Username dan password OSS",
      ],
    },
    {
      title: "Pendirian PT Perorangan",
      price: "Rp 1.800.000",
      description: "Paket pendirian PT Perorangan dengan proses cepat",
      popular: false,
      reviews: 85,
      features: [
        "Akta Pendirian",
        "SK Menkumham",
        "NPWP & SKT",
        "NIB",
        "Surat Izin",
        "Sertifikasi standar",
        "Username dan password OSS",
      ],
    },
    {
      title: "Pendirian CV",
      price: "Rp 1.500.000",
      description: "Paket pendirian CV dengan dokumen lengkap",
      popular: false,
      reviews: 95,
      features: [
        "Akta Pendirian",
        "NPWP & SKT",
        "NIB",
        "Surat Izin",
        "Sertifikasi standar",
        "SPPL",
        "Username dan password OSS",
      ],
    },
    {
      title: "Pendirian Yayasan",
      price: "Rp 2.500.000",
      description: "Paket pendirian Yayasan dengan dokumen lengkap",
      popular: false,
      reviews: 64,
      features: [
        "Akta Pendirian",
        "SK Menkumham",
        "NPWP & SKT",
        "NIB",
        "Surat Izin",
        "Sertifikasi standar",
        "SPPL",
        "Username dan password OSS",
      ],
    },
    {
      title: "Perubahan PT/CV",
      price: "Rp 1.500.000",
      description: "Layanan perubahan data PT atau CV",
      popular: false,
      reviews: 75,
      features: [
        "Perubahan Nama",
        "Perubahan Alamat",
        "Perubahan Kepemilikan",
        "Perubahan Direksi & Komisaris",
        "Perubahan Modal",
        "Update NIB",
        "Update Izin Usaha",
      ],
    },
    {
      title: "Perizinan Usaha",
      price: "Rp 1.200.000",
      description: "Layanan pengurusan izin usaha",
      popular: false,
      reviews: 64,
      features: [
        "Izin Usaha (NIB)",
        "Sertifikat Standar",
        "Izin Operasional",
        "SPPL",
        "Izin Lingkungan",
        "Izin Lokasi",
        "Izin Khusus Sesuai Bidang Usaha",
      ],
    },
  ]

  return (
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
          <Link href="/login">
              <Button variant="outline">Login</Button>
            </Link>
            <Button
  onClick={() =>
    window.open(
      "https://wa.me/6287822344206?text=Saya%20ingin%20konsultasi%20tentang%20layanan%20Dokasah%2C%20bisa%20dibantu%3F",
    )
  }
  className="group"
>
  <MessageCircle className="h-4 w-4" /> {/* Ikon Telepon */}
</Button>
          </div>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Layanan Kami</h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Kami menyediakan berbagai layanan legalitas untuk membantu bisnis Anda berkembang dengan aman dan
                  legal.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <Card
                  key={i}
                  className="relative overflow-hidden border bg-card text-card-foreground shadow-lg transition-all hover:shadow-xl"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 transition-opacity hover:opacity-100" />
                  <CardHeader>
                    {service.popular && <Badge className="absolute top-4 right-4">Terlaris</Badge>}
                    <CardTitle>{service.title}</CardTitle>
                    <CardDescription>{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{service.price}</div>
                    <ul className="mt-4 space-y-2">
                      {service.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <CheckCircle className="h-5 w-5 text-primary mr-2" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="flex justify-between">
                    <Button className="w-full">Pilih Paket</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t bg-muted/40 backdrop-blur-sm">
        <div className="container flex flex-col gap-6 py-8 md:py-12">
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
  )
}

