'use client';

import { useMemo } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { SupportedCurrency } from '@/lib/currency-utils';
import { setUserRegion } from '@/lib/region/client';

/**
 * Storefront currency switch, shared by the header and the mobile menu.
 * Behaviour moved verbatim from the previous components/header.tsx:
 *  1. sync the region cookie,
 *  2. replace ?currency= in the URL without scrolling (the only pricing trigger),
 *  3. refresh server data only on /shop and /products.
 *
 * Uses useSearchParams, so callers must sit inside a <Suspense> boundary.
 */
export function useCurrencySwitch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Memoize currency to stop re-render loop
  const currency = useMemo(() => {
    return (searchParams.get('currency') || 'INR') as SupportedCurrency;
  }, [searchParams]);

  const changeCurrency = (nextCurrency: SupportedCurrency) => {
    // 1. Sync region cookie (for future requests/shipping)
    switch (nextCurrency) {
      case 'USD':
        setUserRegion('US');
        break;
      case 'AED':
        setUserRegion('AE');
        break;
      case 'CAD':
        setUserRegion('CA');
        break;
      case 'GBP':
        setUserRegion('GB');
        break;
      default:
        setUserRegion('IN');
    }

    // 2. Update URL (this is the ONLY trigger for pricing updates now)
    const params = new URLSearchParams(searchParams.toString());
    params.set('currency', nextCurrency);

    // Replace URL without scrolling
    router.replace(`${pathname}?${params.toString()}`, {
      scroll: false,
    });

    // Only refresh server data on shop/product pages; keeps Home instant.
    if (pathname.startsWith('/shop') || pathname.startsWith('/products')) {
      router.refresh();
    }
  };

  return { currency, changeCurrency };
}
