// lib/landed-pricing.ts

import { SupportedCurrency } from './currency-utils';

export type Region = 'IN' | 'US' | 'CA' | 'AE' | 'GB';

type LandedConfig = {
  currency: SupportedCurrency;
  shippingInr: number;
  customsPercent: number;
  handlingInr: number;
  marginPercent: number;
};

export const LANDED_PRICING: Record<Region, LandedConfig> = {
  IN: {
    currency: 'INR',
    shippingInr: 0,
    customsPercent: 0,
    handlingInr: 0,
    marginPercent: 0,
  },
  US: {
    currency: 'USD',
    shippingInr: 2200,
    customsPercent: 12,
    handlingInr: 300,
    marginPercent: 10,
  },
  CA: {
    currency: 'CAD',
    shippingInr: 2400,
    customsPercent: 18,
    handlingInr: 300,
    marginPercent: 10,
  },
  AE: {
    currency: 'AED',
    shippingInr: 1600,
    customsPercent: 5,
    handlingInr: 200,
    marginPercent: 8,
  },
  GB: {
    currency: 'GBP',
    shippingInr: 2600,
    customsPercent: 20,
    handlingInr: 350,
    marginPercent: 12,
  },
};

/**
 * Returns FINAL LANDED PRICE IN INR
 */
export function calculateLandedPriceInr(
  basePriceInr: number,
  region: Region
): number {
  const cfg = LANDED_PRICING[region];

  const customs =
    (basePriceInr * cfg.customsPercent) / 100;

  const subtotal =
    basePriceInr +
    customs +
    cfg.shippingInr +
    cfg.handlingInr;

  const margin =
    (subtotal * cfg.marginPercent) / 100;

  return Math.round(subtotal + margin);
}
// Alias for content.ts compatibility
export function applyLandedPricing(
  basePriceInr: number,
  region: Region
): number {
  return calculateLandedPriceInr(basePriceInr, region);
}
