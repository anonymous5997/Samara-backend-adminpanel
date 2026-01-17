import type { SupportedCurrency } from '@/lib/currency-utils';

export interface ResolvedPrice {
  displayPrice: number;       // Price shown to user (USD / AED / GBP / INR)
  currency: SupportedCurrency; // Display currency
  inrBase: number;            // Final INR charged (Razorpay)
  mrp: number | null;         // Display MRP (optional)
  discountPct: number;        // Percentage (e.g. 47)
  source: 'inr' | 'international';
}

/**
 * Resolves the final price for a product based on region.
 * Now completely decoupled from the database for instant performance.
 */
export async function resolveFinalPrice(
  product: any,
  region: string,
  currency?: string, // Legacy/URL param (ignored for security)
  rates?: Record<string, number> // ✅ NEW: Rates passed from Server/Context
): Promise<ResolvedPrice> {

  /* -----------------------------------------------------------
     1️⃣ BASE INR (SINGLE SOURCE OF TRUTH)
     ----------------------------------------------------------- */
  const inrSelling = Number(product.base_price_inr);
  const inrMrp = Number(product.mrp_inr || 0);

  // Safety check for base data
  if (!inrSelling || inrSelling <= 0) {
    console.error(`Invalid base INR price for product ${product?.id}`);
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
      : 0;

  /* -----------------------------------------------------------
     2️⃣ RESOLVE CURRENCY FROM REGION (STRICT)
     ----------------------------------------------------------- */
  const REGION_TO_CURRENCY: Record<string, SupportedCurrency> = {
    IN: 'INR',
    US: 'USD',
    AE: 'AED',
    GB: 'GBP',
    CA: 'CAD',
    // EU: 'EUR',
    // AU: 'AUD',
  };

  // The server trusts only the region (cookie/detected) for security.
  const resolvedCurrency = REGION_TO_CURRENCY[region] || 'INR';

  /* -----------------------------------------------------------
     3️⃣ FETCH MANUAL ADMIN PRICE (STRICT REGION + CURRENCY)
     ----------------------------------------------------------- */
  // Match BOTH Currency AND Region to ensure uniqueness.
  const manual = product.product_prices?.find(
    (p: any) =>
      p.currency === resolvedCurrency &&
      (p.region === region ||
        !p.region // ✅ allow legacy rows
      )&&
      Number(p.price) > 0
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
     5️⃣ INTERNATIONAL FALLBACK (SAFE MODE)
     ----------------------------------------------------------- */
  // If we are in International mode (e.g. US) but valid
  // price is missing, do NOT crash. Fallback to INR safely.
  if (!manual) {
    console.warn(
      `Missing admin price for ${region}/${resolvedCurrency} on product ${product.id}. Falling back to INR.`
    );

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
     7️⃣ CALCULATE RAZORPAY INR (CONVERSION - INSTANT)
     ----------------------------------------------------------- */
  // Formula: Display Price (Foreign) * Rate (Foreign->INR) = Final INR
  // Example: 497 CAD * 65.18 = ~32395 INR
  
  // Lookup rate from the passed dictionary
  const rate = rates?.[resolvedCurrency];

  // ✅ HARD GUARD: Prevent silent failures (e.g. charging $150 as ₹150)
  // This ensures we never process a payment if we don't know the exchange rate.
  if (!rate) {
    throw new Error(
      `Missing exchange rate for ${resolvedCurrency}. Cannot calculate INR safely.`
    );
  }

  const finalInr = Math.round(displayPrice * rate);

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
    displayPrice,          // e.g. 150 (USD/CAD)
    currency: resolvedCurrency, 
    inrBase: finalInr,     // e.g. 12500 (INR for Razorpay)
    mrp,                   
    discountPct,
    source: 'international',
  };
}