import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentRegion } from '@/lib/region/server';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getSimilarProducts } from '@/lib/content';
import ProductDetailClient from '@/components/ProductDetailClient';
// ✅ STEP 1: Import rate fetcher (Ensure path matches where you saved lib/currency-utils.ts)
import { getCurrencyRates } from '@/lib/currency-utils';

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ currency?: string }>;
}) {
  // Await params and searchParams (Next.js 15 pattern)
  const { slug } = await params;
  const { currency } = await searchParams;

  // Await the client creation
  const supabase = await createClient();
  
  // Region is awaited (best practice for Next.js 15+ if using cookies)
  const region = await getCurrentRegion();
  
  // 1️⃣ Fetch product & images & prices
  const { data: product } = await supabase
    .from('products')
    .select(`
      *,
      product_images (*),
      product_prices (*)
    `)
    .eq('slug', slug)
    .single();

  if (!product) {
    notFound();
  }

  // Sort images: Primary first, then by display_order
  const sortedImages = (product.product_images || []).sort((a: any, b: any) => {
    if (a.is_primary === b.is_primary) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    return a.is_primary ? -1 : 1;
  });

  // ✅ STEP 2: Fetch Currency Rates (Server Side)
  // This gets the latest "1 Foreign Unit -> INR" rates (e.g. CAD: 65.18)
  const rates = await getCurrencyRates();

  // 3️⃣ Resolve price on server
  // We pass the raw currency string; resolveFinalPrice validates it.
  const requestedCurrency = currency as string | undefined;

  // ✅ STEP 3: Pass 'rates' explicitly to the resolver
  const resolvedPrice = await resolveFinalPrice(
    product,
    region,
    requestedCurrency,
    rates 
  );

  // Strict check. Do not fallback silently.
  if (!resolvedPrice) {
    notFound();
  }

  // Normalize the price object for the client
  const priceData = {
    displayPrice: resolvedPrice.displayPrice,
    currency: resolvedPrice.currency,
    inrBase: resolvedPrice.inrBase,
    mrp: resolvedPrice.mrp,
    discountPct: resolvedPrice.discountPct,
  };

  // 4️⃣ Similar products
  const similarProducts = await getSimilarProducts(product.id, 4);

  return (
    <ProductDetailClient
      product={product}
      images={sortedImages}
      priceData={priceData}
      similarProducts={similarProducts || []}
    />
  );
}