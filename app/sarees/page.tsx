import Link from 'next/link';
import { getSareeProducts } from '@/lib/content';
import { Star, Sparkles, Heart, ChevronDown } from 'lucide-react';

export default async function SareesPage() {
  const products = await getSareeProducts();

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-[#0b0b0b] border-b border-[#D4AF37]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              Sarees
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 leading-relaxed">
              Explore our curated saree collection
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 md:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            <aside className="lg:w-64 flex-shrink-0">
              <div className="space-y-4 sticky top-24">
                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">Fabric</span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Silk</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Cotton</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Organza</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">Color</span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Red</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Blue</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Green</span>
                    </label>
                  </div>
                </div>

                <div className="bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg p-6 hover:border-[#D4AF37]/40 transition-all duration-300">
                  <button className="w-full flex items-center justify-between text-left">
                    <span className="font-serif text-lg font-semibold text-[#D4AF37]">Occasion</span>
                    <ChevronDown className="h-5 w-5 text-[#D4AF37]" />
                  </button>
                  <div className="mt-4 space-y-2">
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Wedding</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Party</span>
                    </label>
                    <label className="flex items-center gap-3 text-gray-400 hover:text-[#D4AF37] cursor-pointer transition-colors">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#D4AF37]/30" />
                      <span className="text-sm">Casual</span>
                    </label>
                  </div>
                </div>
              </div>
            </aside>

            <div className="flex-1">
              <div className="mb-8">
                <p className="text-gray-400 text-lg">
                  <span className="text-[#D4AF37] font-semibold">{products.length}</span> products
                </p>
              </div>

              {products.length === 0 ? (
                <div className="text-center py-20 bg-[#0b0b0b] border-2 border-[#D4AF37]/20 rounded-lg">
                  <p className="text-gray-500 text-lg">No sarees available at the moment</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((product) => (
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

                          {product.is_bestseller && (
                            <div className="absolute top-3 left-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                              <Star className="h-3 w-3 fill-current" />
                              {product.bestseller_badge_label || 'Bestseller'}
                            </div>
                          )}

                          {product.is_new_arrival && !product.is_bestseller && (
                            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#D4AF37]/50">
                              <Sparkles className="h-3 w-3" />
                              New
                            </div>
                          )}

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
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
