import type React from "react"
import { Inter } from "next/font/google"
import { AuthProvider } from '@/components/AuthContext';

import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata = {
  title: "Legalitas - Jasa Pembuatan PT dan Legalitas Perusahaan",
  description: "Jasa pembuatan PT dan layanan legalitas perusahaan terpercaya di Indonesia.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <AuthProvider>
      <body className={inter.className}>{children}</body></AuthProvider>
    </html>
  )
}



import './globals.css'