"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpSchema, type SignUpFormData } from "@/lib/validations/auth";
import { Icons } from "@/components/ui/Icons";
import Success from "@/components/Modals/Success";


const Signup = () => {

  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
  });

  const password = watch("password");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"}/auth/signup`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            email: data.email,
            password: data.password,
            name: data.name,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Kayıt işlemi başarısız oldu");
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bir hata oluştu");
    } finally {
      setIsLoading(false);
    }
  };

  // Password strength indicator
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { strength: 0, label: "", color: "" };
    
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[A-Z]/.test(pwd)) strength++;
    if (/[a-z]/.test(pwd)) strength++;
    if (/[0-9!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;

    if (strength === 1) return { strength, label: "Zayıf", color: "bg-red-500" };
    if (strength === 2) return { strength, label: "Orta", color: "bg-yellow-500" };
    if (strength === 3) return { strength, label: "İyi", color: "bg-blue-500" };
    if (strength === 4) return { strength, label: "Güçlü", color: "bg-green-500" };
    return { strength: 0, label: "", color: "" };
  };

  const passwordStrength = getPasswordStrength(password);

  if (success) {
    return (
      <Success />
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full mx-auto py-8 bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
      {/* Card Container with Glass Effect */}
      <div className="w-full max-w-lg mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          
          {/* Header Section with Logo */}
          <div className="bg-gradient-to-br from-blue-600/20 to-cyan-600/20 px-8 py-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
              Hesap Oluşturun
            </h2>
            <p className="text-blue-100 text-sm">
              Hemen ücretsiz hesap oluşturun
            </p>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6">
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

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-medium text-white">
                  Ad Soyad
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.User className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    {...register("name")}
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={`
                      block w-full pl-10 pr-3 py-2 
                      bg-white/5 border rounded-lg
                      text-white placeholder-blue-200/50
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200
                      ${errors.name 
                        ? 'border-red-400/50 focus:ring-red-400' 
                        : 'border-white/20 hover:border-white/30'
                      }
                    `}
                    placeholder="Adınız Soyadınız"
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-300 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Icons.AlertCircle className="h-3 w-3" />
                    {errors.name.message}
                  </p>
                )}
              </div>

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
                      block w-full pl-10 pr-3 py-2 
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
                    autoComplete="new-password"
                    className={`
                      block w-full pl-10 pr-12 py-2 
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
                
                {/* Password Strength Indicator */}
                {password && password.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                            level <= passwordStrength.strength
                              ? passwordStrength.color
                              : 'bg-white/20'
                          }`}
                        />
                      ))}
                    </div>
                    {passwordStrength.label && (
                      <p className="text-xs text-blue-200">
                        Şifre gücü: <span className="font-medium">{passwordStrength.label}</span>
                      </p>
                    )}
                  </div>
                )}

                {errors.password && (
                  <p className="text-xs text-red-300 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Icons.AlertCircle className="h-3 w-3" />
                    {errors.password.message}
                  </p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-white">
                  Şifre Tekrar
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Icons.Lock className="h-5 w-5 text-blue-300" />
                  </div>
                  <input
                    {...register("confirmPassword")}
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    className={`
                      block w-full pl-10 pr-12 py-2 
                      bg-white/5 border rounded-lg
                      text-white placeholder-blue-200/50
                      focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                      transition-all duration-200
                      ${errors.confirmPassword 
                        ? 'border-red-400/50 focus:ring-red-400' 
                        : 'border-white/20 hover:border-white/30'
                      }
                    `}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-300 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? (
                      <Icons.EyeOff className="h-5 w-5" />
                    ) : (
                      <Icons.Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-300 flex items-center gap-1 mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Icons.AlertCircle className="h-3 w-3" />
                    {errors.confirmPassword.message}
                  </p>
                )}
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
                  hover:cursor-pointer
                "
              >
                {isLoading ? (
                  <>
                    <Icons.Spinner className="h-5 w-5 text-white" />
                    <span>Hesap oluşturuluyor...</span>
                  </>
                ) : (
                  <>
                    <span>Hesap Oluştur</span>
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

            {/* Sign In Link */}
            <div className="text-center">
              <p className="text-sm text-blue-100">
                Zaten hesabınız var mı?{" "}
                <Link
                  href="/auth/signin"
                  className="font-semibold text-blue-300 hover:text-blue-200 transition-colors underline-offset-4 hover:underline"
                >
                  Giriş yapın
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-blue-200/60">
            Kayıt olarak{" "}
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
    </div>
  );
};

export default Signup;
