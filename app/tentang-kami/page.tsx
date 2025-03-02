"use client"; // Mark this file as a Client Component

import Image from "next/image"
import Link from "next/link"
import { CheckCircle, MessageCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function AboutUsPage() {
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
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl md:text-6xl">Tentang Kami</h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                  Legalitas adalah mitra terpercaya dalam pendirian dan pengelolaan legalitas perusahaan Anda.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <Badge className="w-fit">Visi Kami</Badge>
                  <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                    Menjadi Mitra Terpercaya dalam Legalitas Bisnis
                  </h2>
                  <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                    Kami berkomitmen untuk menjadi mitra terpercaya bagi setiap pengusaha dalam membangun fondasi legal
                    yang kuat untuk bisnis mereka.
                  </p>
                </div>
                <ul className="grid gap-2">
                  {[
                    "Layanan profesional dan terpercaya",
                    "Tim ahli hukum dan bisnis",
                    "Proses cepat dan transparan",
                    "Dukungan penuh pasca layanan",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="relative mx-auto aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 p-1 shadow-xl dark:from-blue-950 dark:to-indigo-950 sm:w-full">
                <Image
                  src="/placeholder.svg?height=400&width=600"
                  width={600}
                  height={400}
                  alt="Tim Legalitas"
                  className="h-full w-full rounded-lg object-cover"
                />
              </div>
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

