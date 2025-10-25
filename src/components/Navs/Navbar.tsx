"use client";

import Languages from "@/components/Dropdowns/Languages";
import { useTranslations } from "next-intl";
import Link from 'next/link';
import Logo from '@/components/Logo';


const Navbar = () => {

  const t = useTranslations("HomePage");

  return (
      <div className="container flex justify-between items-center mx-auto z-10">
        <Logo variant="header" />
        <div className="flex items-center gap-6">
          <Link href="/features" className="text-white/80 hover:text-white transition-colors">
            {t('NavFeatures')}
          </Link>
          <Link href="/about" className="text-white/80 hover:text-white transition-colors">
            {t('NavHowItWorks')}
          </Link>

          <Languages />

        </div>
      </div>
  );
};

export default Navbar;
