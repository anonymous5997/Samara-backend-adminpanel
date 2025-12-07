import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Star, Sparkles, Heart } from 'lucide-react';
import { HeroSlider } from '@/components/HeroSlider';
import { SectionHeading } from '@/components/SectionHeading';
import { CollectionsGrid } from '@/components/CollectionsGrid';
import { AITryOn } from '@/components/AITryOn';
import { getMostLovedProducts, getNewArrivals } from '@/lib/content';

export default async function Home() {
  const [mostLovedProducts, newArrivals] = await Promise.all([
    getMostLovedProducts(4),
    getNewArrivals(4),
  ]);

  return (
    <div className="bg-black text-white">
      <HeroSlider />

      <section className="py-24 md:py-32 bg-gradient-to-b from-black via-[#0b0b0b] to-black">
        <div className="container mx-auto px-4 md:px-8">
          <SectionHeading
            title="Explore Our Collections"
            subtitle="Signature edits curated for the modern woman"
          />
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
        <section className="py-24 md:py-32 bg-[#0b0b0b]">
          <div className="container mx-auto px-4 md:px-8">
            <SectionHeading
              title="Most Loved by Samara Women"
              subtitle="Discover our bestselling collection"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {mostLovedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all duration-500 hover:-translate-y-2">
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
                    <div className="p-4 bg-gradient-to-b from-black to-[#0b0b0b]">
                      <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37] group-hover:text-[#F4D03F] transition-colors">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                          ₹{product.base_price_inr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-600 line-through">
                          ₹{Math.round(product.base_price_inr * 1.3).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="flex items-center justify-center gap-4 mt-12">
              <button className="w-12 h-12 rounded-full bg-transparent border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 flex items-center justify-center group">
                <ArrowRight className="h-5 w-5 text-[#D4AF37] rotate-180 group-hover:scale-110 transition-transform" />
              </button>
              <button className="w-12 h-12 rounded-full bg-transparent border-2 border-[#D4AF37]/40 hover:border-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all duration-300 flex items-center justify-center group">
                <ArrowRight className="h-5 w-5 text-[#D4AF37] group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-24 md:py-32 bg-gradient-to-b from-black via-[#0b0b0b] to-black">
          <div className="container mx-auto px-4 md:px-8">
            <SectionHeading
              title="New Arrivals"
              subtitle="Fresh designs for the season"
            />
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
              {newArrivals.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-black rounded-lg overflow-hidden border-2 border-[#D4AF37]/20 hover:border-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/40 transition-all duration-500 hover:-translate-y-2">
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

                      {product.is_new_arrival && (
                        <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                          <Sparkles className="h-3 w-3" />
                          New
                        </div>
                      )}

                      <button className="absolute top-3 left-3 w-9 h-9 rounded-full bg-black/60 backdrop-blur-sm border border-[#D4AF37]/30 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110">
                        <Heart className="h-4 w-4 text-[#D4AF37]" />
                      </button>
                    </div>
                    <div className="p-4 bg-gradient-to-b from-black to-[#0b0b0b]">
                      <h3 className="font-serif text-base md:text-lg font-semibold mb-1 line-clamp-1 text-[#D4AF37] group-hover:text-[#F4D03F] transition-colors">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-xs text-gray-500 mb-2">{product.brand}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <p className="text-lg md:text-xl font-bold text-[#D4AF37]">
                          ₹{product.base_price_inr.toLocaleString('en-IN')}
                        </p>
                        <p className="text-sm text-gray-600 line-through">
                          ₹{Math.round(product.base_price_inr * 1.3).toLocaleString('en-IN')}
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
                className="border-2 border-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/20 hover:shadow-lg hover:shadow-[#D4AF37]/40 text-[#D4AF37] font-bold px-10 py-6 text-lg transition-all duration-300 hover:scale-105"
              >
                <Link href="/sarees">
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
