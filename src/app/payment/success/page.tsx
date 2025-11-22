export default function PaymentSuccess() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6 text-center">
        <div className="text-green-500 text-6xl mb-4">✓</div>
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-gray-600 mb-6">
          Your payment has been processed. You will receive a confirmation email shortly.
        </p>
        <p className="text-sm text-yellow-600">
          Note: Payment approval is being verified. Please check your order status.
        </p>
      </div>
    </div>
  );
}
