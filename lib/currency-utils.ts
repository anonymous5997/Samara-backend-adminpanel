import { supabase } from './supabase/client';

interface CurrencyRate {
  base_currency: string;
  target_currency: string;
  rate: number;
}

let cachedRates: Map<string, number> | null = null;
let lastFetch: number = 0;
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

    if (error) {
      console.error('Failed to fetch currency rates:', error);
      return getDefaultRates();
    }

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
  // Fallback rates if database is unavailable
  const defaults = new Map<string, number>();
  defaults.set('USD', 83.5); // 1 USD = 83.5 INR
  defaults.set('AED', 22.75); // 1 AED = 22.75 INR
  return defaults;
}

export async function convertPrice(
  amountInr: number,
  targetCurrency: 'INR' | 'USD' | 'AED'
): Promise<number> {
  if (targetCurrency === 'INR') {
    return amountInr;
  }

  const rates = await getCurrencyRates();
  const rate = rates.get(targetCurrency);

  if (!rate || rate <= 0) {
    console.warn(`Currency rate not found for ${targetCurrency}, returning INR amount`);
    return amountInr;
  }

  return amountInr / rate;
}

export async function formatPrice(
  amountInr: number,
  targetCurrency: 'INR' | 'USD' | 'AED'
): Promise<string> {
  const converted = await convertPrice(amountInr, targetCurrency);

  switch (targetCurrency) {
    case 'INR':
      return `₹${converted.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'USD':
      return `$${converted.toFixed(2)}`;
    case 'AED':
      return `${converted.toFixed(2)} AED`;
    default:
      return `₹${amountInr.toLocaleString('en-IN')}`;
  }
}

export function formatPriceSync(
  amount: number,
  currency: 'INR' | 'USD' | 'AED'
): string {
  switch (currency) {
    case 'INR':
      return `₹${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    case 'USD':
      return `$${amount.toFixed(2)}`;
    case 'AED':
      return `${amount.toFixed(2)} AED`;
    default:
      return `₹${amount.toLocaleString('en-IN')}`;
  }
}

export function getCurrencySymbol(currency: 'INR' | 'USD' | 'AED'): string {
  switch (currency) {
    case 'INR':
      return '₹';
    case 'USD':
      return '$';
    case 'AED':
      return 'AED';
    default:
      return '₹';
  }
}

export function convertPriceSync(
  amountInr: number,
  targetCurrency: 'INR' | 'USD' | 'AED',
  rates: Map<string, number>
): number {
  if (targetCurrency === 'INR') {
    return amountInr;
  }

  const rate = rates.get(targetCurrency);

  if (!rate || rate <= 0) {
    return amountInr;
  }

  return amountInr / rate;
}

export function clearCurrencyCache(): void {
  cachedRates = null;
  lastFetch = 0;
}
