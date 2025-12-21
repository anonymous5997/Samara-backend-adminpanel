'use client';

import dynamic from 'next/dynamic';

const AutoCurrencyClient = dynamic(
  () => import('@/components/AutoCurrencyClient'),
  { ssr: false }
);

export default function AutoCurrencyWrapper() {
  return <AutoCurrencyClient />;
}
