import { Currency } from './types';

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  INR: '₹',
  USD: '$',
  AED: 'د.إ',
};

export function formatPrice(
  amountInr: number,
  currency: Currency,
  rate: number = 1
): string {
  const convertedAmount = amountInr * rate;
  const symbol = CURRENCY_SYMBOLS[currency];

  return `${symbol}${convertedAmount.toFixed(2)}`;
}

export function convertPrice(
  amountInr: number,
  rate: number
): number {
  return amountInr * rate;
}
