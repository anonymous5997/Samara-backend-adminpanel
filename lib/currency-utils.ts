import { supabase } from './supabase/client';

export type SupportedCurrency = 'INR' | 'USD' | 'AED' | 'GBP' | 'CAD';

interface CurrencyRate {
  base_currency: string;
  target_currency: string;
  rate: number; // DB stores: 1 INR → target currency
}

// ✅ FIX: Changed from Map to Record (Plain Object)
let cachedRates: Record<string, number> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

/* -----------------------------------------------------
   FETCH RATES (1 Unit of Foreign Currency → INR)
   Example: USD: 83.33, CAD: 65.18
----------------------------------------------------- */
export async function getCurrencyRates(): Promise<Record<string, number>> {
  const now = Date.now();

  if (cachedRates && now - lastFetch < CACHE_DURATION) {
    return cachedRates;
  }

  try {
    const { data, error } = await supabase
      .from('currency_rates')
      .select('base_currency, target_currency, rate')
      .eq('base_currency', 'INR')
      .eq('enabled', true); 

    if (error) throw error;

    // ✅ FIX: Initialize with strict INR base
    const rates: Record<string, number> = {
      INR: 1, 
    };

    data?.forEach((row: CurrencyRate) => {
      // DB says: 1 INR = 0.012 USD
      // We need: 1 USD = ? INR (for Price Resolution)
      // Math: 1 / 0.012 = 83.33
      if (row.rate > 0) {
        rates[row.target_currency] = Number((1 / row.rate).toFixed(4));
      }
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
   FALLBACK RATES (1 Unit → INR)
----------------------------------------------------- */
function getDefaultRates(): Record<string, number> {
  // ✅ FIX: Values are now "How many Rupees is 1 Unit?"
  return {
    INR: 1,
    USD: 83.5,
    AED: 22.7,
    GBP: 106.5,
    CAD: 61.2,
    EUR: 90.5,
  };
}

/* -----------------------------------------------------
   HELPER: CONVERT INR TO TARGET (LEGACY SUPPORT)
----------------------------------------------------- */
export function convertPriceSync(
  amountInr: number,
  currency: SupportedCurrency,
  rates: Record<string, number>
): number {
  if (currency === 'INR') return amountInr;

  // Since rates are now "1 Unit -> INR" (e.g. USD = 83)
  // To get USD from INR, we DIVIDE.
  const rate = rates[currency];
  if (!rate) return amountInr;

  return amountInr / rate;
}

/* -----------------------------------------------------
   FORMAT ONLY (NO CONVERSION) - ROBUST VERSION
----------------------------------------------------- */
export function formatPriceSync(
  amount: number | null | undefined,
  currency: string // Relaxed type to allow string from DB
): string {
  const safeAmount =
    typeof amount === 'number' && !isNaN(amount) ? amount : 0;

  // Default to INR if currency is missing/invalid
  const safeCurrency = (currency || 'INR') as SupportedCurrency;

  const symbol = getCurrencySymbol(safeCurrency);
  
  // INR = 0 decimals (₹500), Others = 2 decimals ($5.99)
  const fraction = safeCurrency === 'INR' ? 0 : 2;

  try {
    return (
      symbol +
      safeAmount.toLocaleString(
        safeCurrency === 'INR' ? 'en-IN' : 'en-US',
        {
          minimumFractionDigits: fraction,
          maximumFractionDigits: fraction,
        }
      )
    );
  } catch (e) {
    // Fallback if locale fails
    return `${symbol}${safeAmount}`;
  }
}

export function getCurrencySymbol(currency: string): string {
  switch (currency) {
    case 'INR': return '₹';
    case 'USD': return '$';
    case 'AED': return 'AED ';
    case 'GBP': return '£';
    case 'CAD': return 'C$';
    case 'EUR': return '€';
    default: return '₹';
  }
}

export function clearCurrencyCache(): void {
  cachedRates = null;
  lastFetch = 0;
}