import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/* -----------------------------------------------------------
   ✅ REGION & PRICING UTILS
----------------------------------------------------------- */
import { getCurrentRegion } from "@/lib/region/server"; 
import { resolveFinalPrice } from "@/lib/resolve-product-price"; 
import { getCurrencyRates } from "@/lib/currency-utils"; // ✅ Added: Fetch rates on server

export default async function SareePage({
  params,
}: {
  params: { slug: string }
}) {
  const supabase = await createClient();

  // ---------------------------------------------------------
  // 1. GET REGION & RATES (Server-Side)
  // ---------------------------------------------------------
  // We fetch rates here so we can pass them to the resolver.
  // This ensures server rendering matches client math exactly.
  const region = await getCurrentRegion();
  const rates = await getCurrencyRates(); // ✅ Fetch latest rates

  // ---------------------------------------------------------
  // 2. FETCH PRODUCT (Fetch ALL prices, don't filter in SQL)
  // ---------------------------------------------------------
  const { data: product, error } = await supabase
    .from("products")
    .select(`
      *,
      product_images (
        image_url,
        is_primary
      ),
      product_prices (
        region,
        currency,
        price,
        mrp
      )
    `)
    .eq("slug", params.slug)
    .single();

  if (error || !product) {
    return notFound();
  }

  // ---------------------------------------------------------
  // 3. RESOLVE PRICE (Logic handles fallback/conversion)
  // ---------------------------------------------------------
  // ✅ FIX: Pass 'rates' to ensure conversion uses cached/live data.
  // We pass 'undefined' for currency preference so it defaults 
  // to the region's native currency (e.g. US -> USD, IN -> INR).
  const resolved = await resolveFinalPrice(product, region, undefined, rates);

  if (!resolved) {
    // Safety net: if no price exists for this region/product
    return <div className="p-10 text-white">Price not available</div>;
  }

  return (
    <div className="p-10 text-white">
      <h1 className="text-3xl font-bold">{product.name}</h1>
      <p className="mt-4 text-gray-300">{product.description}</p>

      {/* ✅ DISPLAY RESOLVED PRICE */}
      <div className="mt-6 flex items-baseline gap-3">
        <p className="text-2xl font-semibold text-[#D4AF37]">
          {resolved.currency} {resolved.displayPrice}
        </p>
        
        {resolved.mrp && resolved.mrp > resolved.displayPrice && (
          <>
            <p className="text-lg text-gray-500 line-through">
              {resolved.currency} {resolved.mrp}
            </p>
            {resolved.discountPct > 0 && (
              <span className="text-sm font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                {resolved.discountPct}% OFF
              </span>
            )}
          </>
        )}
      </div>
    </div>
  );
}