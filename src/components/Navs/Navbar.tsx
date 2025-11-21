"use client";

import { useTranslations } from "next-intl";
import Link from 'next/link';
import { FiBarChart2, FiLayers } from 'react-icons/fi';

import Languages from "@/components/Dropdowns/Languages";
import Logo from '@/components/Logo';


const Navbar = () => {

  const t = useTranslations("HomePage");

  return (
      <div className="container flex justify-between items-center mx-auto px-4 md:px-0 z-10">
        <Logo variant="header" />

        <div className="flex items-center gap-6">
          <Link href="/features" className="text-white/80 hover:text-white transition-colors">
            <span className="hidden sm:inline">{t('NavFeatures')}</span>
            <FiBarChart2 className="sm:hidden inline h-6 w-6" />
          </Link>

          <Link href="/about" className="text-white/80 hover:text-white transition-colors">
            <span className="hidden sm:inline">{t('NavHowItWorks')}</span>
            <FiLayers className="sm:hidden inline h-6 w-6" />
          </Link>

          <Languages />
        </div>
      </div>
  );
};

export default Navbar;
