import { supabase } from './supabase/client';

interface CurrencyRate {
  base_currency: string;
  target_currency: string;
  rate: number;
}

export type SupportedCurrency = 'INR' | 'USD' | 'AED' | 'GBP' | 'CAD';

let cachedRates: Map<string, number> | null = null;
let lastFetch = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour

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
    data?.forEach((rate: CurrencyRate) => {
      rates.set(rate.target_currency, rate.rate);
    });

    cachedRates = rates;
    lastFetch = now;

    return rates;
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    return getDefaultRates();
  }
}

function getDefaultRates(): Map<string, number> {
  const defaults = new Map<string, number>();

  defaults.set('USD', 83.5);
  defaults.set('AED', 22.75);
  defaults.set('GBP', 105); // example fallback
  defaults.set('CAD', 62); // example fallback

  return defaults;
}

// ---------------------- Convert (Async) ----------------------

export async function convertPrice(
  amountInr: number,
  targetCurrency: SupportedCurrency
): Promise<number> {
  if (targetCurrency === 'INR') return amountInr;

  const rates = await getCurrencyRates();
  const rate = rates.get(targetCurrency);

  if (!rate) return amountInr;

  return amountInr / rate;
}

export async function formatPrice(
  amountInr: number,
  currency: SupportedCurrency
): Promise<string> {
  const converted = await convertPrice(amountInr, currency);
  return formatPriceSync(converted, currency);
}

// ---------------------- Convert (Sync for UI) ----------------------

export function convertPriceSync(
  amountInr: number,
  currency: SupportedCurrency,
  rates?: Map<string, number> | null
): number {
  if (currency === 'INR') return amountInr;
  if (!rates) return amountInr;

  const rate = rates.get(currency);
  if (!rate || rate <= 0) return amountInr;

  return amountInr / rate;
}

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
    case 'AED': return 'AED';
    case 'GBP': return '£';
    case 'CAD': return 'C$';
    default: return '₹';
  }
}

export function clearCurrencyCache(): void {
  cachedRates = null;
  lastFetch = 0;
}
