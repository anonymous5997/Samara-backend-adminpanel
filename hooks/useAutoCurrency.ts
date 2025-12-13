// hooks/useAutoCurrency.ts
'use client';

import { useEffect } from 'react';
import { countryCodeToCurrency } from '@/lib/country-to-currency';
import { useCart } from '@/lib/cart-context';

const GEO_CACHE_KEY = 'samara_geo_currency'; // store { currency, country, ts }
const GEO_CACHE_TTL = 1000 * 60 * 60 * 24; // 24h

type GeoCache = { currency: string; country?: string; ts: number };

export function useAutoCurrency() {
  const { currency, setCurrency } = useCart();

  useEffect(() => {
    // If user already manually changed currency, don't override.
    const manual = localStorage.getItem('samara_currency_manually_set');
    if (manual === '1') return;

    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      try {
        const parsed: GeoCache = JSON.parse(cached);
        const age = Date.now() - parsed.ts;
        if (age < GEO_CACHE_TTL && parsed.currency) {
          // only set if different
          if (parsed.currency !== currency) setCurrency(parsed.currency as any);
          return; // done
        }
      } catch (e) {
        // ignore parse error and continue
      }
    }

    // Perform an IP geo lookup (client-side).
    // You can replace ipapi.co with your preferred provider.
    (async () => {
      try {
        const res = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
        if (!res.ok) throw new Error('geo lookup failed');
        const data = await res.json();
        const country = data.country_code || data.country || undefined;
        const inferred = countryCodeToCurrency(country);

        // save cache
        const toCache: GeoCache = { currency: inferred, country, ts: Date.now() };
        try {
          localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(toCache));
        } catch (e) {
          // ignore quota errors
        }

        // set currency if not manual and different
        const manualNow = localStorage.getItem('samara_currency_manually_set');
        if (manualNow !== '1' && inferred !== currency) {
          setCurrency(inferred as any);
        }
      } catch (err) {
        // failed geo lookup — do nothing (leave default)
        console.warn('Auto-currency geo lookup failed:', err);
      }
    })();
    // only run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
