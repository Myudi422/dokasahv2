import type React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head"; // Tambahkan import ini
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Jasa Legalitas & Pembuatan PT Murah | Dokasah",
  description: "Butuh jasa pembuatan PT, CV, dan izin usaha? Dokasah siap membantu dengan cepat & terpercaya. Konsultasi gratis!",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LegalService",
              "name": "Jasa Legalitas Murah - Dokasah",
              "description": "Dokasah menyediakan layanan jasa legalitas seperti pembuatan PT, CV, izin usaha, dan pengurusan dokumen hukum lainnya.",
              "url": "https://dokasah.web.id/layanan",
              "provider": {
                "@type": "Organization",
                "name": "Dokasah",
                "url": "https://dokasah.web.id"
              },
              "serviceType": "Jasa Legalitas",
              "areaServed": {
                "@type": "Country",
                "name": "Indonesia"
              }
            }),
          }}
        />
      </Head>
      <AuthProvider>
        <body className={inter.className}>{children}</body>
      </AuthProvider>
      <Analytics />
    </html>
  );
}
