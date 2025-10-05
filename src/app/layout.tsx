import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(`${process.env.NEXT_PUBLIC_URL}`),
  title: 'AiSEO - AI Arama Görünürlük Kontrolü',
  description: 'Web sitenizin yapay zeka aramaları üzerindeki görünürlüğünü kontrol edin',
  openGraph: {
    title: 'AiSEO - AI Destekli SEO Analiz Platformu',
    description: 'Web sitenizin yapay zeka aramaları üzerindeki görünürlüğünü kontrol edin',
    type: 'website',
    locale: 'tr_TR',
    url: `${process.env.NEXT_PUBLIC_URL}`,
    siteName: 'AiSEO',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'AiSEO - AI Destekli SEO Analiz Platformu'
      }
    ],
  },
  icons: {
    icon: [
      { url: '/favicon.ico' }
    ],
    apple: [
      { url: '/logo.png', sizes: '180x180', type: 'image/png' }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AiSEO - AI Destekli SEO Analiz Platformu',
    description: 'Web sitenizin yapay zeka aramaları üzerindeki görünürlüğünü kontrol edin',
    images: ['/logo.png']
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
