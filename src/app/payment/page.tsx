'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import PaytrIframe from '@/components/PaytrIframe';


export default function PaymentPage() {

  const searchParams = useSearchParams();
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [merchantOid, setMerchantOid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = searchParams.get('token');
    const oid = searchParams.get('merchantOid');

    if (token && oid) {
      setIframeToken(token);
      setMerchantOid(oid);
      setLoading(false);
    } else {
      // If no token in URL, redirect back to pricing page
      window.location.href = '/pricing';
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Ödeme sayfası yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Güvenli Ödeme</h1>
          <p className="text-gray-600">
            Sipariş No: <span className="font-semibold">{merchantOid}</span>
          </p>
        </div>

        {iframeToken && <PaytrIframe iframeToken={iframeToken} />}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Güvenli Ödeme</p>
              <p>Ödemeniz PayTR güvencesi altında işlenmektedir. Kart bilgileriniz güvenle şifrelenir ve saklanmaz.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
