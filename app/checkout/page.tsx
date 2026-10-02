import { Suspense } from 'react';
import CheckoutClient from './CheckoutClient';

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[70vh] items-center justify-center bg-samara-ink"><span className="sm-eyebrow animate-pulse motion-reduce:animate-none">Loading checkout...</span></div>}>
      <CheckoutClient />
    </Suspense>
  );
}