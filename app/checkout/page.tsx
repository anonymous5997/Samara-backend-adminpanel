import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-10 text-center">Loading checkout...</div>}>
      <CheckoutClient />
    </Suspense>
  );
}