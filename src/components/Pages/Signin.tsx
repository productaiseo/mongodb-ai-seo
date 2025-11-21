"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Icons } from "@/components/ui/Icons";

// Zod schema matching your backend DTO
const signInSchema = z.object({
  email: z.string().email("Geçerli bir e-posta adresi giriniz"),
  password: z.string().min(1, "Şifre gereklidir"),
});

type SignInFormData = z.infer<typeof signInSchema>;

const SignInPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignInFormData>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = async (data: SignInFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/signin`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Giriş işlemi başarısız oldu");
      }

      // Redirect to home page
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full mx-auto py-8 bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
      {/* Card Container with Glass Effect */}
      <div className="w-full max-w-lg bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
        
        {/* Header Section with Logo */}
        <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 px-8 py-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-2">
            Hoş Geldiniz
          </h2>
          <p className="text-blue-100 text-sm">
            Hesabınıza giriş yapın
          </p>
        </div>

        {/* Form Section */}
        <div className="px-8 py-8">
          <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
            
            {/* Error Alert */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icons.XCircle className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-300">{error}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setError(null)}
                    className="flex-shrink-0 text-red-400 hover:text-red-300 transition-colors"
                  >
                    <Icons.X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Email Input */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-white">
                E-posta Adresi
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Email className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  {...register("email")}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`
                    block w-full pl-10 pr-3 py-3 
                    bg-white/5 border rounded-lg
                    text-white placeholder-blue-200/50
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    transition-all duration-200
                    ${errors.email 
                      ? 'border-red-400/50 focus:ring-red-400' 
                      : 'border-white/20 hover:border-white/30'
                    }
                  `}
                  placeholder="ornek@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-300 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Icons.AlertCircle className="h-3 w-3" />
                  {errors.email.message}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-white">
                Şifre
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Icons.Lock className="h-5 w-5 text-blue-300" />
                </div>
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  className={`
                    block w-full pl-10 pr-12 py-3 
                    bg-white/5 border rounded-lg
                    text-white placeholder-blue-200/50
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                    transition-all duration-200
                    ${errors.password 
                      ? 'border-red-400/50 focus:ring-red-400' 
                      : 'border-white/20 hover:border-white/30'
                    }
                  `}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors"
                >
                  {showPassword ? (
                    <Icons.EyeOff className="h-5 w-5" />
                  ) : (
                    <Icons.Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-300 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                  <Icons.AlertCircle className="h-3 w-3" />
                  {errors.password.message}
                </p>
              )}
            </div>

            {/* Forgot Password Link */}
            <div className="flex items-center justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm font-medium text-blue-300 hover:text-blue-200 transition-colors"
              >
                Şifrenizi mi unuttunuz?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="
                relative w-full flex justify-center items-center gap-2
                py-3 px-4 
                bg-gradient-to-r from-blue-500 to-cyan-500
                hover:from-blue-600 hover:to-cyan-600
                text-white font-semibold rounded-lg
                focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-blue-950
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-blue-500 disabled:hover:to-cyan-500
                transition-all duration-200
                shadow-lg hover:shadow-xl hover:shadow-blue-500/30
                transform hover:scale-[1.02] active:scale-[0.98]
              "
            >
              {isLoading ? (
                <>
                  <Icons.Spinner className="h-5 w-5 text-white" />
                  <span>Giriş yapılıyor...</span>
                </>
              ) : (
                <>
                  <span>Giriş Yap</span>
                  <Icons.ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-transparent text-blue-200">veya</span>
            </div>
          </div>

          {/* Sign Up Link */}
          <div className="text-center">
            <p className="text-sm text-blue-100">
              Hesabınız yok mu?{" "}
              <Link
                href="/auth/signup"
                className="font-semibold text-blue-300 hover:text-blue-200 transition-colors underline-offset-4 hover:underline"
              >
                Hemen kayıt olun
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-6 text-center">
        <p className="text-xs text-blue-200/60">
          Giriş yaparak{" "}
          <Link href="/#" className="underline hover:text-blue-200 transition-colors">
            Kullanım Koşulları
          </Link>
          {" "}ve{" "}
          <Link href="/#" className="underline hover:text-blue-200 transition-colors">
            Gizlilik Politikası
          </Link>
          'nı kabul etmiş olursunuz.
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
