import Link from 'next/link';
import { getCollectionBySlug, getCollectionProducts } from '@/lib/content';
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
import { getCurrencyRates } from '@/lib/currency-utils';
import { getCurrentRegion } from '@/lib/region/server';
import { ProductCard } from '@/components/product-card';
import { ArrowLeft } from 'lucide-react';

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
      <div className="bg-samara-void text-samara-ivory min-h-screen flex items-center justify-center pt-32 pb-24">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-samara-gold mb-4">Collection Not Found</h2>
          <p className="text-samara-ivory/60 mb-6 font-sans">The collection you're looking for doesn't exist.</p>
          <Link href="/collections" className="text-[11px] font-sans tracking-widest uppercase text-samara-gold hover:text-samara-goldDeep transition-colors border-b border-samara-gold/30 hover:border-samara-gold pb-1">
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
  
  const priceMap = new Map<string, ResolvedPrice>();

  for (const product of products) {
    const resolved = await resolveFinalPrice(product, region, undefined, rates);
    if (resolved) {
      priceMap.set(product.id, resolved);
    }
  }

  // ---------------------------------------------------------
  // 4. RENDER
  // ---------------------------------------------------------
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-24 md:pt-32 pb-24 md:pb-32">
      
      {/* Back to collections link */}
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl mb-8">
        <Link href="/collections" className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />
          All Collections
        </Link>
      </div>

      {/* HERO SECTION */}
      {collection.hero_image_url ? (
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl mb-16 md:mb-24">
          <div className="relative aspect-[16/9] md:aspect-[21/9] overflow-hidden bg-samara-void1">
            <div className="absolute inset-0 bg-samara-void/30 z-10" />
            <img
              src={collection.hero_image_url}
              alt={collection.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center px-6">
              <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4">
                Collection
              </span>
              <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-4 text-samara-ivory">
                {collection.hero_title || collection.name}
              </h1>
              {collection.hero_subtitle && (
                <p className="text-sm md:text-base font-sans tracking-wide text-samara-ivory/80 max-w-2xl mx-auto">
                   {collection.hero_subtitle}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl mb-16 md:mb-24 text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Collection
          </span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6 text-samara-ivory">
            {collection.name}
          </h1>
          {collection.description && (
            <p className="text-sm md:text-base font-sans text-samara-ivory/60 max-w-2xl mx-auto leading-relaxed">
               {collection.description}
            </p>
          )}
        </div>
      )}

      {/* PRODUCTS GRID */}
      <section>
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          {products.length === 0 ? (
            <div className="text-center py-24 bg-samara-void1/50 border border-samara-ivory/10">
              <p className="text-sm font-sans tracking-widest text-samara-ivory/40 uppercase">No pieces in this collection yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
              {products.map((product) => {
                const resolved = priceMap.get(product.id);
                const mainImage = product.images?.find(img => img.is_primary) 
                                     || product.images?.[0];
                
                return (
                   <ProductCard 
                      key={product.id}
                      product={product}
                      image={mainImage}
                      price={resolved}
                   />
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}