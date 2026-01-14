import { supabase } from '@/lib/supabase/client';
import type { SupportedCurrency } from '@/lib/currency-utils';

export interface ResolvedPrice {
  displayPrice: number;       // Price shown to user (USD / AED / GBP / INR)
  currency: SupportedCurrency; // Display currency
  inrBase: number;            // Final INR charged (Razorpay)
  mrp: number | null;         // Display MRP (optional)
  discountPct: number | null;
  source: 'inr' | 'international';
}

export async function resolveFinalPrice(
  product: any,
  region: string,
  currency?: string // Optional: allow override or auto-detection
): Promise<ResolvedPrice> {

  /* -----------------------------------------------------------
     1️⃣ BASE INR (SINGLE SOURCE OF TRUTH)
     ----------------------------------------------------------- */
  const inrSelling = Number(product.base_price_inr);
  const inrMrp = Number(product.mrp_inr || 0);

  if (!inrSelling || inrSelling <= 0) {
    console.error(`Invalid base INR price for product ${product?.id}`);
    // Safety fallback
    return {
      displayPrice: 0,
      currency: 'INR',
      inrBase: 0,
      mrp: null,
      discountPct: 0,
      source: 'inr'
    };
  }

  const discountPct =
    inrMrp && inrMrp > inrSelling
      ? Math.round(((inrMrp - inrSelling) / inrMrp) * 100)
      : null;

  /* -----------------------------------------------------------
     2️⃣ RESOLVE CURRENCY FROM REGION
     ----------------------------------------------------------- */
  const REGION_TO_CURRENCY: Record<string, SupportedCurrency> = {
    IN: 'INR',
    US: 'USD',
    AE: 'AED',
    GB: 'GBP',
    CA: 'CAD',
    // EU: 'EUR', // Assuming EUR is supported in your types
    // AU: 'AUD', // Add others as needed
  };

  // Priority: Explicit currency -> Region map -> Default to INR
  const resolvedCurrency =
    (currency as SupportedCurrency) ||
    REGION_TO_CURRENCY[region] ||
    'INR';

  /* -----------------------------------------------------------
     3️⃣ FETCH MANUAL ADMIN PRICE
     ----------------------------------------------------------- */
  const manual = product.product_prices?.find(
    (p: any) => p.currency === resolvedCurrency && Number(p.price) > 0
  );

  /* -----------------------------------------------------------
     4️⃣ INDIA LOGIC (ALWAYS INR)
     ----------------------------------------------------------- */
  if (resolvedCurrency === 'INR') {
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
     5️⃣ INTERNATIONAL FALLBACK (STRICT)
     ----------------------------------------------------------- */
  // If we are International (USD/GBP etc) but NO Admin price exists,
  // strictly fallback to INR. We do NOT auto-convert for display.
  if (!manual) {
    console.error(`Missing price for ${resolvedCurrency} on product ${product.id}`);
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
     6️⃣ SET DISPLAY PRICE (ADMIN DEFINED)
     ----------------------------------------------------------- */
  // USA sees $150, UK sees £135, etc. exactly as typed in Admin.
  const displayPrice = Number(manual.price);

  /* -----------------------------------------------------------
     7️⃣ CALCULATE RAZORPAY INR (CONVERSION)
     ----------------------------------------------------------- */
  // We need to charge the equivalent INR. 
  // Formula: Display Price (USD) * Rate (USD->INR) = Final INR
  
  let finalInr = inrSelling;

  const { data: rateRow } = await supabase
    .from('currency_rates')
    .select('rate')
    .eq('base_currency', resolvedCurrency)
    .eq('target_currency', 'INR')
    .eq('enabled', true)
    .single();

  if (rateRow?.rate) {
    finalInr = Math.round(displayPrice * Number(rateRow.rate));
  } else {
    // Critical error: Admin set a USD price but didn't set an exchange rate.
    // Fallback to base INR to ensure payment can still proceed, 
    // or you could throw an error if you prefer strictness.
    console.warn(`Missing exchange rate for ${resolvedCurrency} -> INR. Using Base INR.`);
    finalInr = inrSelling;
  }

  /* -----------------------------------------------------------
     8️⃣ MRP REBUILD (VISUAL ONLY)
     ----------------------------------------------------------- */
  // Recalculate MRP to keep the Discount % consistent visually
  const mrp =
    discountPct && discountPct > 0
      ? Math.round(displayPrice / (1 - discountPct / 100))
      : null;

  /* -----------------------------------------------------------
     9️⃣ RETURN FINAL RESOLVED PRICE
     ----------------------------------------------------------- */
  return {
    displayPrice,          // e.g. 150
    currency: resolvedCurrency, // USD
    inrBase: finalInr,     // e.g. 13500 (For Razorpay)
    mrp,                   // Optional strikethrough
    discountPct,
    source: 'international',
  };
}