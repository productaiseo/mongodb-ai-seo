import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {NextIntlClientProvider} from 'next-intl';
import { getLocale, getMessages } from "next-intl/server";


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


type Props = {
  children: React.ReactNode;
};


export default async function RootLayout({children}: Readonly<Props>) {

  const messages = await getMessages();
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
