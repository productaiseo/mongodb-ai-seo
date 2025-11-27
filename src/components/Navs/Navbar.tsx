"use client";

import { useTranslations } from "next-intl";
import Link from 'next/link';
import { Button } from "@/components/ui/button";
import { FiBarChart2, FiLayers } from 'react-icons/fi';
import { Icons } from "../ui/Icons";
import { useAuth } from "@/contexts/AuthContext";

import Languages from "@/components/Dropdowns/Languages";
import Logo from '@/components/Logo';


const Navbar = () => {

  const t = useTranslations("HomePage");
  const { user, isAuthenticated, signOut, isLoading } = useAuth();

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

        <Link href="/pricing" className="text-white/80 hover:text-white transition-colors">
          <span className="hidden sm:inline">{t('NavPricing')}</span>
          <FiLayers className="sm:hidden inline h-6 w-6" />
        </Link>

        {/* Show loading state */}
        {isLoading ? (
          <div className="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-md text-white/80">
            <Icons.Spinner className="w-4 h-4 animate-spin" />
          </div>
        ) : isAuthenticated ? (
          /* Show user dropdown when authenticated */
          <Button
            onClick={signOut}
            className="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors bg-transparent hover:cursor-pointer"
            title="Sign out"
          >
            <span className="hidden sm:inline">{t('NavSignout')}</span>
            <Icons.ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          /* Show sign-in button when not authenticated */
          <Link
            href="/auth/signin"
            className="flex items-center gap-2 border border-white/20 px-3 py-1.5 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <span className="hidden sm:inline">{t('NavSignin')}</span>
            <Icons.Signin className="w-4 h-4 text-border-color" />
          </Link>
        )}

        <Languages />
      </div>
    </div>
  );
};

export default Navbar;
