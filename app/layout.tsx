import type React from "react";
import { Inter } from "next/font/google";
import { AuthProvider } from "@/components/AuthContext";
import { Analytics } from "@vercel/analytics/react";
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
        {/* Google Pixel Base Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','YOUR_GOOGLE_PIXEL_ID');
            `,
          }}
        />

        {/* Meta Pixel Base Code */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              !function(f,b,e,v,n,t,s) {
                if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)}; 
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)
              }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', 'YOUR_META_PIXEL_ID'); // Replace with your Meta Pixel ID
              fbq('track', 'PageView');
            `,
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "LegalService",
              "name": "Jasa Legalitas Murah - Dokasah",
              "description":
                "Dokasah menyediakan layanan jasa legalitas seperti pembuatan PT, CV, izin usaha, dan pengurusan dokumen hukum lainnya.",
              "url": "https://dokasah.web.id/layanan",
              "provider": {
                "@type": "Organization",
                "name": "Dokasah",
                "url": "https://dokasah.web.id",
              },
              "serviceType": "Jasa Legalitas",
              "areaServed": {
                "@type": "Country",
                "name": "Indonesia",
              },
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
