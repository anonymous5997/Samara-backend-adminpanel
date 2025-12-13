'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getFestiveEditProducts, type ProductWithImages } from '@/lib/content';
import { Star, Sparkles } from 'lucide-react';
import { useCart } from '@/lib/cart-context';
import {
  getCurrencyRates,
  convertPriceSync,
  formatPriceSync,
} from '@/lib/currency-utils';

export default function FestiveEditPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);
  const [rates, setRates] = useState<Map<string, number> | null>(null);

  // currency comes from your cart context (selected currency code)
  const { currency } = useCart();

  // Load products
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

  // Load currency rates once (used to convert INR -> chosen currency)
  useEffect(() => {
    getCurrencyRates()
      .then((r) => setRates(r))
      .catch((err) => {
        console.error('Error loading currency rates:', err);
        setRates(null);
      });
  }, []);

  // Helper: format product price in the selected currency (falls back to INR)
  const formatProductPrice = (inrAmount: number) => {
    // convertPriceSync will fall back to INR if rates missing
    const converted = convertPriceSync(inrAmount, currency, rates);
    return formatPriceSync(converted, currency);
  };

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="relative py-24 bg-gradient-to-b from-black via-luxury-charcoal to-black">
        <div className="container mx-auto px-4 md:px-8">
          {/* Title */}
          <div className="text-center mb-16">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
              Festive Edit
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Celebrate in style with our curated collection of festive sarees,
              designed to make every occasion unforgettable.
            </p>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="text-center py-20">
              <p className="text-gray-500">Loading festive collection...</p>
            </div>
          ) : products.length === 0 ? (
            /* Empty state */
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
            /* Product grid */
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/30 transition-all duration-500">
                    {/* Image */}
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

                      {/* Bestseller tag */}
                      {product.is_bestseller && (
                        <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Star className="h-3 w-3 fill-current" />
                          {product.bestseller_badge_label || 'Bestseller'}
                        </div>
                      )}

                      {/* New Arrival tag */}
                      {product.is_new_arrival && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-gold to-gold-light text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                          <Sparkles className="h-3 w-3" />
                          New
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                        {product.name}
                      </h3>

                      {product.brand && (
                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                      )}

                      {/* Price: converted & formatted */}
                      <p className="text-xl font-bold text-gold">
                        {formatProductPrice(product.base_price_inr)}
                      </p>
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
