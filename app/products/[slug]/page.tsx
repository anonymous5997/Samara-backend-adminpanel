import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentRegion } from '@/lib/region/server';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getSimilarProducts } from '@/lib/content';
import ProductDetailClient from '@/components/ProductDetailClient';
import { SupportedCurrency } from '@/lib/currency-utils';

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
  const region = await getCurrentRegion();
  
  // 1️⃣ Fetch product & images
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

  // 2️⃣ Resolve price on server
  // PRIORITY 1: URL Query Param (e.g. ?currency=USD)
  // PRIORITY 2: Region auto-detect (handled inside resolveFinalPrice)
  
  // We pass the raw currency string; resolveFinalPrice validates it.
  const requestedCurrency = currency as string | undefined;

  const resolvedPrice = await resolveFinalPrice(
    product,
    region,
    requestedCurrency
  );

  // Normalize the price object for the client
  const priceData = {
    displayPrice: resolvedPrice ? resolvedPrice.displayPrice : product.base_price_inr,
    currency: resolvedPrice ? resolvedPrice.currency : 'INR',
    inrBase: resolvedPrice ? resolvedPrice.inrBase : product.base_price_inr,
    mrp: resolvedPrice ? resolvedPrice.mrp : null,
    discountPct: resolvedPrice ? resolvedPrice.discountPct : 0
  };

  // 3️⃣ Similar products
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