'use client';

import { useState } from 'react';
import PaytrIframe from '@/components/PaytrIframe';

export default function PaymentPage() {
  const [iframeToken, setIframeToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/paytr/test/get-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 10000, // 100.00 TL (multiply by 100)
          email: 'yusuf@aiseoptimizer.com',
          userName: 'Müşteri Adı',
          userAddress: 'İstanbul, Türkiye',
          userPhone: '05555555555',
          currency: 'TL',
          maxInstallment: '0',
          noInstallment: '0',
          testMode: '1', // Test mode
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIframeToken(data.iframeToken);
      } else {
        setError(data.error || 'Payment initialization failed');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error('Payment initiation error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">PayTR Payment</h1>

      {!iframeToken ? (
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="mb-6">
              <p className="text-gray-600">Amount: 100.00 TL</p>
              <p className="text-gray-600">Products: 3 items</p>
            </div>

            <button
              onClick={initiatePayment}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Loading...' : 'Proceed to Payment'}
            </button>

            {error && (
              <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>
        </div>
      ) : (
        <PaytrIframe iframeToken={iframeToken} />
      )}
    </div>
  );
}
