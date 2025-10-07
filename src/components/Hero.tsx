"use client";
import { useTranslations } from "next-intl";
import UrlForm from "@/components/Forms/UrlForm";
import { motion } from "framer-motion";

const Hero = () => {

  const t = useTranslations("HomePage");

  return (
    <div className="w-full max-w-4xl mx-auto mt-16 flex flex-col items-center px-4 z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
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

      {/* Özellikler */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-16"
      >
        <div className="bg-blue-900/20 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">AI Görünürlük Analizi</h3>
          <p className="text-white/70">
            Sitenizin ChatGPT, Bing AI ve Google gibi tüm AI araçlarında nasıl
            göründüğünü kontrol edin.
          </p>
        </div>

        <div className="bg-blue-900/20 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">
            İyileştirme Tavsiyeleri
          </h3>
          <p className="text-white/70">
            AI aramalarında daha iyi görünmek için sitenize özel optimizasyon
            önerileri alın.
          </p>
        </div>

        <div className="bg-blue-900/20 backdrop-blur-md border border-blue-800/30 rounded-xl p-6">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              ></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Düzenli Raporlar</h3>
          <p className="text-white/70">
            Sitenizin AI araçlarındaki performansını düzenli olarak takip edin
            ve gelişiminizi görün.
          </p>
        </div>
      </motion.div>

      {/* Ek içerik - Müşteri logoları veya referanslar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="w-full mt-24 text-center"
      >
        <p className="text-white/50 text-sm mb-6">
          BİNLERCE ŞİRKET TARAFINDAN GÜVENİLİYOR
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
