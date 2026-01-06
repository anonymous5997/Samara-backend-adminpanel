// lib/resolve-product-price.ts

import { supabase } from '@/lib/supabase/client';

export interface ResolvedPrice {
  displayPrice: number;      // Price shown to user (USD / AED / GBP / INR)
  currency: string;          // Display currency
  inrBase: number;           // Final INR charged (Razorpay)
  mrp: number | null;        // Display MRP (optional)
  discountPct: number | null;
  source: 'inr' | 'international';
}

export async function resolveFinalPrice(
  product: any,
  region: string,
  currency: string
): Promise<ResolvedPrice> {

  /* -----------------------------------------------------------
     1️⃣ BASE INR (SINGLE SOURCE OF TRUTH)
     ----------------------------------------------------------- */
  const inrSelling = Number(product.base_price_inr);
  const inrMrp = Number(product.mrp_inr || 0);

  if (!inrSelling || inrSelling <= 0) {
    console.error(`Invalid base INR price for product ${product?.id}`);
    throw new Error('Invalid base INR price');
  }

  const discountPct =
    inrMrp && inrMrp > inrSelling
      ? Math.round(((inrMrp - inrSelling) / inrMrp) * 100)
      : null;

  /* -----------------------------------------------------------
     2️⃣ INDIA CUSTOMER (NO CONVERSION)
     ----------------------------------------------------------- */
  if (currency === 'INR') {
    return {
      displayPrice: inrSelling,
      currency: 'INR',
      inrBase: inrSelling,
      mrp: inrMrp || null,
      discountPct,
      source: 'inr',
    };
  }

  /* -----------------------------------------------------------
     3️⃣ INTERNATIONAL CUSTOMER
     ----------------------------------------------------------- */

  // A. Manual price entered in Admin (USD / AED / GBP / CAD)
  const manual = product.product_prices?.find(
    (p: any) => p.currency === currency && Number(p.price) > 0
  );

  if (!manual) {
    console.warn(`No manual price for ${currency} on product ${product?.id}`);
    throw new Error(`Price not available in ${currency}`);
  }

  const displayPrice = Number(manual.price);

  /* -----------------------------------------------------------
     4️⃣ FETCH EXCHANGE RATE (FOREIGN → INR)
     ----------------------------------------------------------- */
  // Admin stores: 1 USD = ₹90.13 (example)

  const { data: rateRow, error } = await supabase
    .from('currency_rates')
    .select('rate')
    .eq('base_currency', currency)   // USD / AED / GBP / CAD
    .eq('target_currency', 'INR')    // Always INR
    .eq('enabled', true)
    .single();

  if (error || !rateRow?.rate) {
    console.error(`Missing exchange rate for ${currency}`);
    throw new Error(`Exchange rate missing for ${currency}`);
  }

  const foreignToInrRate = Number(rateRow.rate);

  if (!foreignToInrRate || foreignToInrRate <= 0) {
    throw new Error(`Invalid exchange rate for ${currency}`);
  }

  /* -----------------------------------------------------------
     5️⃣ CONVERT FOREIGN → INR (FINAL & CORRECT)
     ----------------------------------------------------------- */
  // Example:
  // $150 × 90.13 = ₹13,520

  const finalInr = Math.round(displayPrice * foreignToInrRate);

  /* -----------------------------------------------------------
     6️⃣ MRP REBUILD (VISUAL ONLY — KEEP DISCOUNT SAME)
     ----------------------------------------------------------- */
  const mrp =
    discountPct && discountPct > 0
      ? Math.round(displayPrice / (1 - discountPct / 100))
      : null;

  /* -----------------------------------------------------------
     7️⃣ FINAL RETURN
     ----------------------------------------------------------- */
  return {
    displayPrice,          // e.g. 150
    currency,              // USD
    inrBase: finalInr,     // e.g. 13520 (Razorpay)
    mrp,                   // Optional strikethrough
    discountPct,
    source: 'international',
  };
}
