"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import UrlForm from "@/components/Forms/UrlForm";
import Features from "@/components/Features";


const Hero = () => {

  const t = useTranslations("HomePage");

  return (
    <div className="container flex flex-col mx-auto px-4 md:px-0 items-center gap-12 mt-8 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          {t("title")}{" "}
        {/* 
          Web siteniz 
          <span className="text-cyan-400">AI aramalarında</span>
          {" "}görünür mü?
        */}
        </h1>
        <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
          {t("heroText")}
        </p>

        <UrlForm />
      </motion.div>

      <Features />

      {/* Ek içerik - Müşteri logoları veya referanslar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full mt-16 text-center"
      >
        <p className="text-white/50 text-sm mb-6">
          {t("TrustingCompanies")}
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
          {/* Logo placeholder'lar - gerçek projede bu kısma gerçek logolar eklenebilir */}
          <div className="w-24 h-12 bg-white/10 rounded-md"></div>
          <div className="w-24 h-12 bg-white/10 rounded-md"></div>
          <div className="w-24 h-12 bg-white/10 rounded-md"></div>
          <div className="w-24 h-12 bg-white/10 rounded-md"></div>
          <div className="w-24 h-12 bg-white/10 rounded-md"></div>
        </div>
      </motion.div>
    </div>
  );
};

export default Hero;
