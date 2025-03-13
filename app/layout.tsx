import type React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { Analytics } from "@vercel/analytics/react";
import Head from "next/head";
import Script from "next/script";
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
        {/* Google Tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-674897184"
          strategy="afterInteractive"
        />
        <Script
          id="google-ads"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-674897184');
            `,
          }}
        />
      </Head>
      <body className={inter.className}>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
