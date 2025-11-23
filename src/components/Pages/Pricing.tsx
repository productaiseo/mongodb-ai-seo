"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { pricingTiers, PricingTier } from "@/lib/datas/pricingTiers";
import { Icons } from "@/components/ui/Icons";


const PricingPage = () => {

  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSelectPlan = async (tier: PricingTier) => {
    setLoading(tier.id);
    setError(null);

    try {
      // Prepare basket items based on selected plan
      const basket = [
        {
          name: tier.name,
          price: (tier.price / 100).toFixed(2),
          quantity: 1,
        },
      ];

      const response = await fetch("/api/paytr/get-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: tier.price,
          email: "customer@example.com", // Bu gerçek kullanıcı emaili olmalı
          userName: "Müşteri Adı", // Gerçek kullanıcı adı
          userAddress: "İstanbul, Türkiye", // Gerçek adres
          userPhone: "05555555555", // Gerçek telefon
          currency: "TL",
          maxInstallment: "12",
          noInstallment: "0",
          testMode: "1", // Production'da '0' olmalı
          planId: tier.id,
          planName: tier.name,
          basket: basket,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Store selected plan info in sessionStorage for success page
        sessionStorage.setItem(
          "selectedPlan",
          JSON.stringify({
            id: tier.id,
            name: tier.name,
            price: tier.displayPrice,
            merchantOid: data.merchantOid,
          })
        );

        // Redirect to payment page with iframe token
        router.push(
          `/payment?token=${data.iframeToken}&merchantOid=${data.merchantOid}`
        );
      } else {
        setError(data.error || "Ödeme başlatılamadı. Lütfen tekrar deneyin.");
      }
    } catch (err) {
      setError("Bağlantı hatası. Lütfen tekrar deneyin.");
      console.error("Payment initiation error:", err);
    } finally {
      setLoading(null);
    }
  };

  return (
    // <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-7xl mx-auto py-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fiyatlandırma Planları
          </h1>
          <p className="text-xl text-white max-w-2xl mx-auto">
            İşletmeniz için en uygun AI görünürlük paketini seçin
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="max-w-4xl mx-auto mb-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {pricingTiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-blue-900/20 backdrop-blur-md 
                rounded-2xl shadow-md shadow-blue-800 overflow-hidden transition-transform hover:scale-105 ${
                tier.popular ? "ring-2 ring-blue-700" : ""
              }`}
            >
              {/* Popular Badge */}
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-blue-600 text-white px-4 py-1 rounded-bl-lg text-sm font-semibold">
                  En Popüler
                </div>
              )}

              <div className="flex flex-col h-full p-8">
                {/* Plan Name */}
                <h3 className="text-2xl font-bold text-white">
                  {tier.name}
                </h3>

                {/* Description */}
                <p className="text-gray-100 min-h-[48px]">
                  {tier.description}
                </p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-white">
                    ₺{tier.displayPrice}
                  </span>
                  <span className="text-gray-100 ml-2">/ay</span>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-8">
                  {tier.features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-gray-100">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <button
                  onClick={() => handleSelectPlan(tier)}
                  disabled={loading !== null}
                  className={`w-full py-4 mt-auto rounded-lg font-semibold transition-all hover:cursor-pointer ${
                    tier.popular
                      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading === tier.id ? (
                    <span className="flex items-center justify-center">
                      <Icons.Spinner className="h-5 w-5 text-white" />
                      İşleniyor...
                    </span>
                  ) : (
                    "Planı Seç"
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-white mb-4">
            Tüm planlar aylık faturalandırılır ve istediğiniz zaman iptal
            edebilirsiniz.
          </p>
          <p className="text-white">
            Sorularınız mı var?{" "}
            <a
              href="mailto:destek@aiseoptimizer.com"
              className="text-blue-600 hover:underline"
            >
              Bizimle iletişime geçin
            </a>
          </p>
        </div>
      </div>
    // </div>
  );
};

export default PricingPage;
