// ✅ FIX: Force dynamic rendering to prevent caching of reviews
export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCurrentRegion } from '@/lib/region/server';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getSimilarProducts } from '@/lib/content';
import ProductDetailClient from '@/components/ProductDetailClient';
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
  
  // Region is awaited
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

  // ✅ DEBUG: Print Product ID to Server Terminal (Optional, can remove later)
  console.log('PAGE PRODUCT ID ===>', product.id);

  // Sort images: Primary first, then by display_order
  const sortedImages = (product.product_images || []).sort((a: any, b: any) => {
    if (a.is_primary === b.is_primary) {
      return (a.display_order || 0) - (b.display_order || 0);
    }
    return a.is_primary ? -1 : 1;
  });

  // 2️⃣ Fetch Currency Rates (Server Side)
  const rates = await getCurrencyRates();

  // 3️⃣ Resolve price on server
  const requestedCurrency = currency as string | undefined;
  
  const resolvedPrice = await resolveFinalPrice(
    product,
    region,
    requestedCurrency,
    rates 
  );

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

  // 5️⃣ Fetch product reviews
  const { data: reviews , error} = await supabase
    .from('product_reviews')
    .select(`
      id,
      rating,
      review_text,
      review_image_url,
      created_at,
      user_id,
      profiles(
        name
      )
    `)
    .eq('product_id', product.id)
    .order('created_at', { ascending: false });
  

  // Compute Average Rating & Count
  const reviewCount = reviews?.length ?? 0;
  // @ts-ignore
  const avgRating = reviewCount > 0
    // @ts-ignore
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviewCount
    : null;

  // 6️⃣ Get Current User
  const { data: { user } } = await supabase.auth.getUser();

  // ✅ STEP 1: Check if user has already reviewed
  let hasUserReviewed = false;
  if (user) {
    hasUserReviewed = Boolean(
      reviews?.some((r) => r.user_id === user.id)
    );
  }

  // 7️⃣ Check if user purchased this product (Verified Buyer)
  let isVerifiedBuyer = false;

  if (user) {
    // Get IDs of completed orders for this user
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('id')
      .eq('user_id', user.id)
      .eq('payment_status', 'paid');

    const orderIds = completedOrders?.map(order => order.id) || [];

    if (orderIds.length > 0) {
      // Check if the current product exists in those orders
      const { data: purchase } = await supabase
        .from('order_items')
        .select('id')
        .eq('product_id', product.id)
        .in('order_id', orderIds)
        .limit(1)
        .maybeSingle();

      isVerifiedBuyer = Boolean(purchase);
    }
  }

  return (
    <ProductDetailClient
      product={product}
      images={sortedImages}
      priceData={priceData}
      similarProducts={similarProducts || []}
      reviews={reviews ?? []}
      isVerifiedBuyer={isVerifiedBuyer}
      avgRating={avgRating}
      reviewCount={reviewCount}
      hasUserReviewed={hasUserReviewed}
    />
  );
}