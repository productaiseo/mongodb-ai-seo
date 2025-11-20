import { Icons } from "@/components/ui/Icons";
import Link from "next/link";

const Success = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center w-full mx-auto py-8 bg-gradient-to-b from-blue-950 to-cyan-900 text-white">
      <div className="w-full max-w-md mx-auto px-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 overflow-hidden p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-500/20 border-2 border-green-400 mb-4">
              <svg
                className="h-8 w-8 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={3}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-3">
              Kayıt Başarılı!
            </h2>
            <p className="text-blue-100 text-sm mb-6">
              E-posta adresinize bir doğrulama linki gönderdik. Lütfen
              e-postanızı kontrol edin ve hesabınızı aktifleştirin.
            </p>
            <Link
              href="/auth/signin"
              className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Giriş Sayfasına Git
              <Icons.ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Success;
