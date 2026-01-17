import Link from 'next/link';
import { Star, Sparkles } from 'lucide-react';
import { getCollectionBySlug, getCollectionProducts } from '@/lib/content';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { formatPriceSync, getCurrencyRates } from '@/lib/currency-utils';
import { getCurrentRegion } from '@/lib/region/server';
import type { SupportedCurrency } from '@/lib/currency-utils';

export default async function CollectionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;

  // ---------------------------------------------------------
  // 1. FETCH DATA (Parallel)
  // ---------------------------------------------------------
  const [collection, products] = await Promise.all([
    getCollectionBySlug(slug),
    getCollectionProducts(slug),
  ]);

  // ---------------------------------------------------------
  // 2. HANDLE NOT FOUND
  // ---------------------------------------------------------
  if (!collection) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-[#D4AF37] mb-4">Collection Not Found</h2>
          <p className="text-gray-400 mb-6">The collection you're looking for doesn't exist.</p>
          <Link href="/collections" className="text-[#D4AF37] hover:underline">
            Browse All Collections
          </Link>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------
  // 3. RESOLVE PRICES (Server-Side)
  // ---------------------------------------------------------
  const region = await getCurrentRegion();
  const rates = await getCurrencyRates();
  
  const priceMap = new Map<
    string,
    { price: number; currency: SupportedCurrency }
  >();

  for (const product of products) {
    const resolved = await resolveFinalPrice(product, region, undefined, rates);
    if (resolved) {
      priceMap.set(product.id, {
        price: resolved.displayPrice,
        currency: resolved.currency as SupportedCurrency,
      });
    }
  }

  // ---------------------------------------------------------
  // 4. RENDER
  // ---------------------------------------------------------
  return (
    <div className="bg-black text-white min-h-screen">
      {/* HERO SECTION */}
      {collection.hero_image_url && (
        <div className="relative h-96 bg-[#050505] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
          <img
            src={collection.hero_image_url}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-4 text-[#D4AF37] tracking-tighter">
              {collection.hero_title || collection.name}
            </h1>
            {collection.hero_subtitle && (
              <p className="text-xl text-gray-300">{collection.hero_subtitle}</p>
            )}
          </div>
        </div>
      )}

      {/* PRODUCTS GRID */}
      <section className="py-20 bg-gradient-to-b from-[#111111] to-black">
        <div className="container mx-auto px-4 md:px-8">
          {!collection.hero_image_url && (
            <div className="mb-12 text-center">
              <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-[#D4AF37] tracking-tighter">
                {collection.name}
              </h1>
              {collection.description && (
                <p className="text-xl text-gray-400 max-w-2xl mx-auto">{collection.description}</p>
              )}
            </div>
          )}

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No products in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const resolved = priceMap.get(product.id);
                
                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500">
                      <div className="aspect-[3/4] relative overflow-hidden bg-[#1a1a1a]">
                        {product.primary_image_url ? (
                          <img
                            src={product.primary_image_url}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-600">
                            Product Image
                          </div>
                        )}
                        {product.is_bestseller && (
                          <div className="absolute top-3 left-3 bg-[#D4AF37] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                            <Star className="h-3 w-3 fill-current" />
                            {product.bestseller_badge_label || 'Bestseller'}
                          </div>
                        )}
                        {product.is_new_arrival && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg z-10">
                            <Sparkles className="h-3 w-3" />
                            New
                          </div>
                        )}
                      </div>
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37]">
                          {product.name}
                        </h3>
                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                        )}
                        
                        {/* PRICE DISPLAY */}
                        {resolved ? (
                          <p className="text-xl font-bold text-[#D4AF37]">
                            {formatPriceSync(resolved.price, resolved.currency)}
                          </p>
                        ) : (
                          <div className="h-6 w-24 bg-gray-800 rounded animate-pulse" />
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}