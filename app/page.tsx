import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Heart, Sparkles } from 'lucide-react';
import { HeroSlider } from '@/components/HeroSlider';
import { SectionHeading } from '@/components/SectionHeading';
import { CollectionsGrid } from '@/components/CollectionsGrid';
import { AITryOn } from '@/components/AITryOn';
import { getMostLovedProducts, getNewArrivals } from '@/lib/content';

export default async function Home() {
  const mostLovedProducts = await getMostLovedProducts(4);
  const newArrivals = await getNewArrivals(4);

  return (
    <div className="bg-[#000000]">
      <HeroSlider />

      <section className="py-20 md:py-24 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
              Explore Our Collections
            </h2>
            <p className="text-lg text-[#CFCFCF]">
              Signature edits curated for the modern woman
            </p>
          </div>
          <CollectionsGrid />

          <div className="text-center mt-16">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
            >
              <Link href="/collections">
                View All Collections
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {mostLovedProducts.length > 0 && (
        <section className="py-20 md:py-24 bg-[#050505]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
                Most Loved by Samara Women
              </h2>
              <p className="text-lg text-[#CFCFCF]">
                Discover our bestselling collection
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {mostLovedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-gradient-to-br from-[#0d0d0d] to-[#000000] rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111111] to-[#0b0b0b]">
                          <span className="text-gray-700 font-serif text-sm">Product Image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                        <Star className="h-3 w-3 fill-current" />
                        Bestseller
                      </div>

                      <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                        <Heart className="h-4 w-4 text-[#D4AF37]" />
                      </button>
                    </div>
                    <div className="p-4 bg-gradient-to-b from-[#0d0d0d] to-[#000000]">
                      <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-white group-hover:text-[#D4AF37] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                          ₹{product.base_price_inr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-600 line-through">
                          ₹{Math.round(product.base_price_inr * 1.4).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-center gap-2 mt-12">
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0
                        ? 'w-8 bg-[#D4AF37]'
                        : 'w-2 bg-[#D4AF37]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-20 md:py-24 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
                New Arrivals
              </h2>
              <p className="text-lg text-[#CFCFCF]">
                Fresh designs for the season
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {newArrivals.map((product, idx) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-gradient-to-br from-[#0d0d0d] to-[#000000] rounded-2xl overflow-hidden border border-[#D4AF37]/30 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/50 transition-all duration-500 hover:-translate-y-2">
                    <div className="aspect-[3/4] relative overflow-hidden bg-[#111111]">
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#111111] to-[#0b0b0b]">
                          <span className="text-gray-700 font-serif text-sm">Product Image</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {idx < 2 && (
                        <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                          <Sparkles className="h-3 w-3 fill-current" />
                          New
                        </div>
                      )}

                      <button className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                        <Heart className="h-4 w-4 text-[#D4AF37]" />
                      </button>
                    </div>
                    <div className="p-4 bg-gradient-to-b from-[#0d0d0d] to-[#000000]">
                      <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-white group-hover:text-[#D4AF37] transition-colors">
                        {product.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mt-2">
                        <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                          ₹{product.base_price_inr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-600 line-through">
                          ₹{Math.round(product.base_price_inr * 1.4).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 hover:shadow-lg hover:shadow-[#D4AF37]/50 text-[#D4AF37] font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
              >
                <Link href="/shop">
                  View All New Arrivals
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <AITryOn />
    </div>
  );
}
