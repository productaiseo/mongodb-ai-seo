'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      const token = searchParams?.get('token');
      const callbackURL = searchParams?.get('callbackURL') || '/';

      if (!token) {
        setStatus('error');
        setMessage('Doğrulama tokeni bulunamadı.');
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/auth/verify-email?token=${encodeURIComponent(token)}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            // body: JSON.stringify({ token }),
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || 'E-posta doğrulama başarısız oldu');
        }

        setStatus('success');
        setMessage('E-posta adresiniz başarıyla doğrulandı!');

        // Redirect after 2 seconds
        setTimeout(() => {
          router.push(callbackURL);
        }, 2000);
      } catch (err) {
        setStatus('error');
        setMessage(
          err instanceof Error 
            ? err.message 
            : 'E-posta doğrulama sırasında bir hata oluştu'
        );
      }
    };

    verifyEmail();
  }, [searchParams, router]);

  const handleResendVerification = async () => {
    setIsResending(true);
    
    // Get email from user (you might want to store this in localStorage during signup)
    const email = prompt('Lütfen e-posta adresinizi giriniz:');
    
    if (!email) {
      setIsResending(false);
      return;
    }

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/auth/resend-verification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Doğrulama e-postası gönderilemedi');
      }

      alert('Doğrulama e-postası başarıyla gönderildi! Lütfen gelen kutunuzu kontrol edin.');
    } catch (err) {
      alert(
        err instanceof Error 
          ? err.message 
          : 'E-posta gönderilirken bir hata oluştu'
      );
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100">
              <svg
                className="animate-spin h-6 w-6 text-blue-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              E-posta Doğrulanıyor
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Lütfen bekleyiniz...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Doğrulama Başarılı!
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            <p className="mt-2 text-sm text-gray-500">
              Yönlendiriliyorsunuz...
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              Doğrulama Başarısız
            </h2>
            <p className="mt-2 text-sm text-gray-600">{message}</p>
            
            <div className="mt-6 space-y-4">
              <button
                onClick={handleResendVerification}
                disabled={isResending}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isResending ? 'Gönderiliyor...' : 'Doğrulama E-postasını Tekrar Gönder'}
              </button>
              
              <Link
                href="/auth/signin"
                className="block w-full text-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Giriş Sayfasına Dön
              </Link>
            </div>

            <div className="mt-4">
              <p className="text-xs text-gray-500">
                Sorun devam ediyorsa lütfen destek ekibimizle iletişime geçin.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
