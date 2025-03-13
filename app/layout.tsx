import type React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import { GoogleTagManager } from "@next/third-parties/google";
import Head from "next/head";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Jasa Legalitas & Pembuatan PT Murah | Dokasah",
  description:
    "Butuh jasa pembuatan PT, CV, dan izin usaha? Dokasah siap membantu dengan cepat & terpercaya. Konsultasi gratis!",
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
        {/* Google Tag Manager */}
        <GoogleTagManager gtmId="GTM-NJB6D8GX" />
      </Head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}