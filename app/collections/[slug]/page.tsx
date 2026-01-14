'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCollectionBySlug, getCollectionProducts } from '@/lib/content';
import type { Collection, ProductWithImages } from '@/lib/content';
import { Star, Sparkles } from 'lucide-react';

/* ✅ STEP 2: IMPORT PRICING UTILS */
import { useCart } from '@/lib/cart-context';
import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { formatPriceSync } from '@/lib/currency-utils';
import { getUserRegion } from '@/lib/get-user-region';
import type { SupportedCurrency } from '@/lib/currency';

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  /* ✅ STEP 3: ADD STATE FOR RESOLVED PRICES & REGION */
  const { currency } = useCart();
  const [region, setRegion] = useState<string>('IN'); // Default to IN, update async
  const [priceMap, setPriceMap] = useState<
    Record<string, { price: number; currency: SupportedCurrency }>
  >({});

  // 1. Load Collection Data
  useEffect(() => {
    loadCollectionData();
  }, [slug]);

  // 2. Load User Region Asynchronously
  useEffect(() => {
    const loadRegion = async () => {
      try {
        const r = await getUserRegion();
        setRegion(r);
      } catch (error) {
        console.error('Failed to load region:', error);
      }
    };
    loadRegion();
  }, []);

  const loadCollectionData = async () => {
    try {
      const [collectionData, productsData] = await Promise.all([
        getCollectionBySlug(slug),
        getCollectionProducts(slug),
      ]);

      setCollection(collectionData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading collection:', error);
    } finally {
      setLoading(false);
    }
  };

  /* ✅ STEP 4: RESOLVE PRICES AFTER PRODUCTS & REGION LOAD */
  useEffect(() => {
    if (!products.length || !region) return;

    const loadPrices = async () => {
      const map: Record<string, { price: number; currency: SupportedCurrency }> = {};

      for (const product of products) {
        // Now passing a string region, not a Promise
        const resolved = await resolveFinalPrice(
          product,
          region,
          currency
        );

        if (resolved?.displayPrice) {
          map[product.id] = {
            price: resolved.displayPrice,
            currency: resolved.currency as SupportedCurrency,
          };
        }
      }

      setPriceMap(map);
    };

    loadPrices();
  }, [products, region, currency]);

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-gold mb-4">Collection Not Found</h2>
          <p className="text-gray-400 mb-6">The collection you're looking for doesn't exist.</p>
          <Link href="/collections" className="text-gold hover:underline">
            Browse All Collections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      {collection.hero_image_url && (
        <div className="relative h-96 bg-luxury-black overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
          <img
            src={collection.hero_image_url}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-4 text-gold tracking-tighter">
              {collection.hero_title || collection.name}
            </h1>
            {collection.hero_subtitle && (
              <p className="text-xl text-gray-300">{collection.hero_subtitle}</p>
            )}
          </div>
        </div>
      )}

      <section className="py-20 bg-gradient-to-b from-luxury-charcoal to-black">
        <div className="container mx-auto px-4 md:px-8">
          {!collection.hero_image_url && (
            <div className="mb-12 text-center">
              <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
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
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/30 transition-all duration-500">
                    <div className="aspect-[3/4] relative overflow-hidden bg-luxury-charcoal">
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
                        <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Star className="h-3 w-3 fill-current" />
                          {product.bestseller_badge_label}
                        </div>
                      )}
                      {product.is_new_arrival && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-gold-light text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          New
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                      )}
                      
                      {/* ✅ STEP 5: RENDER CORRECT PRICE */}
                      {(() => {
                        const resolved = priceMap[product.id];
                        if (!resolved) return null;

                        return (
                          <p className="text-xl font-bold text-gold">
                            {formatPriceSync(resolved.price, resolved.currency)}
                          </p>
                        );
                      })()}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}