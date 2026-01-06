// lib/currency-utils.ts

import { supabase } from './supabase/client';

export type SupportedCurrency = 'INR' | 'USD' | 'AED' | 'GBP' | 'CAD';

interface CurrencyRate {
  base_currency: string;
  target_currency: string;
  rate: number; // 1 INR → target currency
}

let cachedRates: Map<string, number> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/* -----------------------------------------------------
   FETCH RATES (1 INR → Target Currency)
----------------------------------------------------- */
export async function getCurrencyRates(): Promise<Map<string, number>> {
  const now = Date.now();

  if (cachedRates && now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('base_currency, target_currency, rate')
      .eq('base_currency', 'INR');

    if (error) throw error;

    const rates = new Map<string, number>();
    data?.forEach((row: CurrencyRate) => {
      rates.set(row.target_currency, row.rate);
    });

    cachedRates = rates;
    lastFetch = now;

    return rates;
  } catch (err) {
    console.error('Currency rate fetch failed:', err);
    return getDefaultRates();
  }
}

/* -----------------------------------------------------
   FALLBACK RATES (1 INR → Target)
----------------------------------------------------- */
function getDefaultRates(): Map<string, number> {
  return new Map<string, number>([
    ['USD', 0.012],
    ['AED', 0.044],
    ['GBP', 0.0095],
    ['CAD', 0.016],
  ]);
}

/* -----------------------------------------------------
   CONVERT LANDED INR → TARGET CURRENCY
----------------------------------------------------- */
export function convertPriceSync(
  amountInr: number,
  currency: SupportedCurrency,
  rates: Map<string, number>
): number {
  if (currency === 'INR') return amountInr;

  const rate = rates.get(currency);
  if (!rate) return amountInr;

  // ✅ INR → Currency = MULTIPLY
  return amountInr * rate;
}

/* -----------------------------------------------------
   FORMAT ONLY (NO CONVERSION)
----------------------------------------------------- */
export function formatPriceSync(
  amount: number,
  currency: SupportedCurrency
): string {
  const symbol = getCurrencySymbol(currency);
  const fraction = currency === 'INR' ? 0 : 2;

  return (
    symbol +
    amount.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US', {
      minimumFractionDigits: fraction,
      maximumFractionDigits: fraction,
    })
  );
}

export function getCurrencySymbol(currency: SupportedCurrency): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'AED': return 'AED ';
    case 'GBP': return '£';
    case 'CAD': return 'C$';
    default: return '₹';
  }
}

export function clearCurrencyCache(): void {
  cachedRates = null;
  lastFetch = 0;
}
