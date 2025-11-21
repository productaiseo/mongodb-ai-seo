"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";
import { authApi } from "@/lib/api/auth";

const ForgotPassword = () => {
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      setIsLoading(true);
      await authApi.forgotPassword(data.email);
      setIsSuccess(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center w-full mx-auto bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
        <div className="w-full max-w-lg px-8 py-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              E-posta Gönderildi
            </h2>
            <p className="text-white mb-6">
              Şifre sıfırlama bağlantısı e-posta adresinize gönderildi. Lütfen
              gelen kutunuzu kontrol edin.
            </p>
            <Link
              href="/auth/signin"
              className="text-white font-medium"
            >
              Giriş sayfasına dön
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full mx-auto bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
      <div className="w-full max-w-lg px-8 py-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">
            Şifremi Unuttum
          </h2>
          <p className="text-white">
            E-posta adresinizi girin, size şifre sıfırlama bağlantısı
            gönderelim.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-white mb-2"
            >
              E-posta Adresi
            </label>
            <input
              {...register("email")}
              type="email"
              id="email"
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="ornek@email.com"
              disabled={isLoading}
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">
                {errors.email.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {isLoading
              ? "Gönderiliyor..."
              : "Şifre Sıfırlama Bağlantısı Gönder"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            href="/auth/signin"
            className=" text-white"
          >
            ← Giriş sayfasına dön
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
