"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe } from "lucide-react";
import Image from "next/image";

const Languages = () => {
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

  const languages = [
    { code: "en", name: "English", flag: "/flags/flag-gb.svg" },
    { code: "tr", name: "Türkçe", flag: "/flags/flag-tr.svg" },
  ];

  const currentLanguage = languages?.find((lang) => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 border border-white/20 px-3 py-2 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors hover:cursor-pointer">
        {currentLanguage ? (
          <>
            {/* <span className="text-lg">{currentLanguage?.flag}</span> */}
            <Image
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              width={20}
              height={20}
              className="rounded-sm"
            />
            <span className="hidden sm:inline text-sm font-medium">
              {currentLanguage?.code.toUpperCase()}
            </span>
          </>
        ) : (
          <>
            <Globe className="w-4 h-4" />
            <span className="text-sm font-medium">Language</span>
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLocale(lang.code)}
            className={`flex items-center gap-3 cursor-pointer ${
              locale === lang.code ? "bg-accent" : ""
            }`}
          >
            {/* <span className="text-xl">{lang.flag}</span> */}
            <Image
              src={lang.flag}
              alt={lang.name}
              width={20}
              height={20}
              className="rounded-sm"
            />
            <span className="font-medium">{lang.name}</span>
            {locale === lang.code && <span className="ml-auto text-xs">✓</span>}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default Languages;
