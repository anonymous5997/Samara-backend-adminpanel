'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFestiveEditProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import { formatPriceSync } from '@/lib/currency-utils';

/* -----------------------------------------------------
   ✅ PRICING UTILITIES & REGION FIX
----------------------------------------------------- */
import { resolveFinalPrice, ResolvedPrice } from '@/lib/resolve-product-price';
// ✅ FIXED: Using the client-side region detector
import { getUserRegion } from '@/lib/region/client';

export default function FestiveEditPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  // Context & Region
  const { currency } = useCart();
  const region = getUserRegion();

  // Price State
  const [priceMap, setPriceMap] = useState<Record<string, ResolvedPrice>>({});

  /* -----------------------------------------------------
     1. LOAD PRODUCTS
  ----------------------------------------------------- */
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await getFestiveEditProducts();
        setProducts(data);
      } catch (error) {
        console.error('Error loading festive products:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  /* -----------------------------------------------------
     2. RESOLVE PRICES (SINGLE SOURCE OF TRUTH)
  ----------------------------------------------------- */
  // This logic correctly delegates all calculation to the library.
  // We strictly avoid manual calculation in the UI.
  
  useEffect(() => {
    if (!products.length) return;

    const loadPrices = async () => {
      const map: Record<string, ResolvedPrice> = {};

      for (const product of products) {
        // 
        // The resolver uses the corrected 'region' to decide if Landed Pricing applies.
        const resolved = await resolveFinalPrice(product, region, currency);
        map[product.id] = resolved;
      }

      setPriceMap(map);
    };

    loadPrices();
  }, [products, region, currency]);

  /* -----------------------------------------------------
     RENDER
  ----------------------------------------------------- */
  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative py-24 bg-gradient-to-b from-black via-luxury-charcoal to-black">
        <div className="container mx-auto px-4 md:px-8">
          
          {/* HEADER */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
              Festive Edit
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Celebrate in style with our curated collection of festive sarees,
              designed to make every occasion unforgettable.
            </p>
          </div>

          {/* LOADING & EMPTY STATES */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Loading festive collection...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500 mb-8">
                Our festive collection is being curated. Check back soon!
              </p>
              <Link
                href="/sarees"
                className="inline-block px-8 py-3 bg-gold-gradient text-black font-semibold rounded-lg hover:shadow-xl hover:shadow-gold/40 transition-all"
              >
                Browse All Sarees
              </Link>
            </div>
          ) : (
            
            /* PRODUCT GRID */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const price = priceMap[product.id];

                return (
                  <Link key={product.id} href={`/products/${product.slug}`}>
                    <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/30 transition-all duration-500">

                      {/* IMAGE CONTAINER */}
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

                        {/* BADGES */}
                        {product.is_bestseller && (
                          <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Star className="h-3 w-3 fill-current" />
                            {product.bestseller_badge_label || 'Bestseller'}
                          </div>
                        )}

                        {product.is_new_arrival && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-gold-light text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                            <Sparkles className="h-3 w-3" />
                            New
                          </div>
                        )}
                      </div>

                      {/* DETAILS & PRICING */}
                      <div className="p-4">
                        <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                          {product.name}
                        </h3>

                        {product.brand && (
                          <p className="text-sm text-gray-500 mb-2">
                            {product.brand}
                          </p>
                        )}

                        {!price ? (
                          <div className="h-5 w-24 bg-gray-800 animate-pulse rounded" />
                        ) : (
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Display Price */}
                            <p className="text-xl font-bold text-gold">
                              {formatPriceSync(price.displayPrice, price.currency)}
                            </p>

                            {/* MRP (Only if higher) */}
                            {price.mrp && price.mrp > price.displayPrice && (
                              <p className="text-sm text-gray-500 line-through">
                                {formatPriceSync(price.mrp, price.currency)}
                              </p>
                            )}

                            {/* Discount Percentage */}
                            {price.discountPct && price.discountPct > 0 && (
                              <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-0.5 rounded ml-auto">
                                {price.discountPct}% OFF
                              </span>
                            )}
                          </div>
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