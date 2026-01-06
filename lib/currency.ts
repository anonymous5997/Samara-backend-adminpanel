// lib/currency.ts

/* -----------------------------------------------------
   Supported Currencies
----------------------------------------------------- */

export type SupportedCurrency =
  | 'INR'
  | 'USD'
  | 'AED'
  | 'EUR'
  | 'GBP'
  | 'CAD';

/* -----------------------------------------------------
   Currency Symbols
----------------------------------------------------- */

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  AED: 'AED ',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
};

/* -----------------------------------------------------
   FORMAT PRICE (FORMAT ONLY — NO CONVERSION)
   RULES:
   - amount MUST already be final
   - NEVER convert currency here
   - NEVER crash UI
----------------------------------------------------- */

export function formatPrice(
  amount: number | null | undefined,
  currency: SupportedCurrency
): string {
  // 🛡️ Absolute safety guard
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return CURRENCY_SYMBOLS[currency] + '0';
  }

  const locale = currency === 'INR' ? 'en-IN' : 'en-US';

  // INR has no decimals, others use 2
  const fractionDigits = currency === 'INR' ? 0 : 2;

  return (
    CURRENCY_SYMBOLS[currency] +
    amount.toLocaleString(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })
  );
}
