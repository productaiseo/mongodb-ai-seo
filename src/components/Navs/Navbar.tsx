/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";
import { useTranslations } from "next-intl";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from 'next/link';
import Logo from '@/components/Logo';


const Navbar = () => {

  const t = useTranslations("HomePage");

  const [locale, setLocale] = useState<string>("");
  const router = useRouter();

  useEffect(() => {
    const cookieLocale = document.cookie
      .split("; ")
      .find((row) => row.startsWith("MYNEXTAPP_LOCALE="))
      ?.split("=")[1];

    if (cookieLocale) {
      setLocale(cookieLocale);
    } else {
        const browserLocale = navigator.language.slice(0, 2);
        setLocale(browserLocale);
        document.cookie = `MYNEXTAPP_LOCALE=${browserLocale};`;
        router.refresh();
    }
  }, [router]);

  const changeLocale = (newLocale: string) => {
    setLocale(newLocale);
    document.cookie = `MYNEXTAPP_LOCALE=${newLocale};`;
    router.refresh();
  };


  return (
      <div className="w-full max-w-7xl mx-auto px-4 absolute top-0 left-0 right-0 z-10">
        <div className="flex justify-between items-center py-4">
          <Logo variant="header" />
          <div className="flex items-center gap-6">
            <Link href="/features" className="text-white/80 hover:text-white transition-colors">
              Özellikler
            </Link>
            <Link href="/about" className="text-white/80 hover:text-white transition-colors">
              Nasıl Çalışır
            </Link>

            <button
              onClick={() => changeLocale("en")}
              className={`border p-2 font-bold rounded-md text-sm ${
                locale === "en" ? "bg-white text-black" : ""
              }`}
            >
              EN
            </button>

            <button
              onClick={() => changeLocale("tr")}
              className={`border p-2 font-bold rounded-md text-sm ${
                locale === "tr" ? "bg-white text-black" : ""
              }`}
            >
              TR
            </button>
            {/* <AuthButton variant="header" /> */}
          </div>
        </div>
      </div>
  );
};

export default Navbar;