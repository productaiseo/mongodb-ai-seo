"use client";

import React, { useState, useRef } from "react";
import { FiSearch, FiArrowRight } from "react-icons/fi";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";


const UrlForm = () => {

  const t = useTranslations("HomePage");
  
  const [url, setUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      setError("Lütfen bir web sitesi URL'si girin");
      return;
    }

    // Basit URL formatı doğrulama
    const urlPattern =
      /^(?:(?:https?):\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+(?:\/[^\s]*)?$/;
    if (!urlPattern.test(url)) {
      setError("Lütfen geçerli bir URL formatı girin");
      return;
    }

    setError("");
    setIsLoading(true);

    try {
      // URL'den www ve http/https kısmını temizle
      const cleanUrl = url
        .replace(/^(https?:\/\/)?(www\.)?/, "")
        .replace(/\/$/, "");

      // Sonuç sayfasına yönlendir
      router.push(`/results/${encodeURIComponent(cleanUrl)}`);
    } catch (err) {
      console.error("Error processing URL:", err);
      setError("Bir hata oluştu. Lütfen tekrar deneyin.");
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row w-full gap-3 mt-10"
      >
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <FiSearch className="text-blue-300" size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={t("UrlForm.placeholder")}
            className="w-full py-4 pl-12 pr-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/50 text-white placeholder-white/50"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className={`py-4 px-8 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 rounded-xl font-medium flex items-center justify-center transition-all ${
            isLoading ? "opacity-70 cursor-not-allowed" : ""
          }`}
        >
          {isLoading ? (
            <div className="w-5 h-5 border-t-2 border-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>{t("UrlForm.startButton")}</span>
              <FiArrowRight className="ml-2" />
            </>
          )}
        </button>
      </form>

      {error && <div className="mt-3 text-red-400 text-sm">{error}</div>}
    </div>
  );
};

export default UrlForm;
