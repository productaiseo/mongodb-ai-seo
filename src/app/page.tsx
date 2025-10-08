import { getMessages } from 'next-intl/server';

import Hero from '@/components/Hero';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navs/Navbar';
// import AuthButton from '@/components/AuthButton';


export async function generateMetadata({
  params: { locale },
} : {
  params: { locale: string };
}) {
  const messages = await getMessages({ locale });
  const title = messages?.TabTitles?.home;
  return {
    title,
  }
}


export default function Home() {

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-blue-950 to-cyan-900 text-white px-4 py-16 md:py-24">
      {/* Arka plan animasyonu */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-800/10 via-transparent to-transparent opacity-70"></div>
        <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full mix-blend-screen filter blur-3xl animate-blob"></div>
        <div className="absolute top-2/3 right-1/4 w-96 h-96 bg-cyan-500/15 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>
      
      <Navbar />
      
      {/* Ana içerik */}
      <Hero />
      
      {/* Alt bilgi çubuğu */}
      <Footer />

    </main>
  );
}
