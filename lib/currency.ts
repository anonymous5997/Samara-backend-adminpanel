import { SupportedCurrency } from "./currency-utils";

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: "₹",
  USD: "$",
  AED: "AED",
  GBP: "£",
  CAD: "C$",
};

export function formatPrice(
  amountInr: number,
  currency: SupportedCurrency,
  rate: number = 1
): string {
  let converted = amountInr;

  if (currency !== "INR" && rate > 0) {
    converted = amountInr / rate;
  }

  return (
    CURRENCY_SYMBOLS[currency] +
    converted.toLocaleString(currency === "INR" ? "en-IN" : "en-US", {
      minimumFractionDigits: currency === "INR" ? 0 : 2,
      maximumFractionDigits: currency === "INR" ? 0 : 2,
    })
  );
}

export function convertPrice(amountInr: number, rate: number): number {
  if (!rate || rate <= 0) return amountInr;
  return amountInr / rate;
}
