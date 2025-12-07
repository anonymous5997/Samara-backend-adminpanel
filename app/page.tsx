import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight, Star, Sparkles, Zap } from 'lucide-react';
import { getHomeHeroSlides, getMostLovedProducts, getNewArrivals } from '@/lib/content';

async function getFeaturedProducts() {
  const { data: products } = await supabase
    .from('products')
    .select('*')
    .eq('is_active', true)
    .limit(8);

  const productsWithImages = await Promise.all(
    (products || []).map(async (product) => {
      const { data: image } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', product.id)
        .eq('is_primary', true)
        .maybeSingle();

      return { product, image };
    })
  );

  return productsWithImages;
}

export default async function Home() {
  const [heroSlides, mostLovedProducts, newArrivals, featuredProducts] = await Promise.all([
    getHomeHeroSlides(),
    getMostLovedProducts(4),
    getNewArrivals(4),
    getFeaturedProducts(),
  ]);

  const currentSlide = heroSlides[0] || {
    title: 'Festive Elegance',
    subtitle: 'Discover handcrafted sarees that blend tradition with timeless beauty',
    primary_cta_label: 'Explore Collection',
    primary_cta_url: '/sarees',
    secondary_cta_label: 'Festive Edit',
    secondary_cta_url: '/festive-edit',
    image_url: 'https://images.pexels.com/photos/8533402/pexels-photo-8533402.jpeg?auto=compress&cs=tinysrgb&w=1920',
  };

  return (
    <div className="bg-black text-white">
      <section className="relative min-h-[85vh] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: currentSlide.image_url ? `url(${currentSlide.image_url})` : 'none',
          }}
        />

        <div className="relative z-20 container mx-auto px-4 md:px-8 h-full min-h-[85vh] flex items-center">
          <div className="max-w-3xl pt-12 md:pt-0 pl-0 md:pl-12">
            <h1 className="font-serif text-6xl md:text-8xl font-bold mb-6 text-gold tracking-tighter leading-tight">
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p className="text-xl md:text-2xl mb-12 text-gray-300 leading-relaxed">
                {currentSlide.subtitle}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              {currentSlide.primary_cta_label && currentSlide.primary_cta_url && (
                <Button
                  size="lg"
                  asChild
                  className="bg-gold-gradient hover:shadow-2xl hover:shadow-gold/50 text-black font-semibold px-8 py-6 text-lg transition-all duration-300"
                >
                  <Link href={currentSlide.primary_cta_url}>
                    {currentSlide.primary_cta_label}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              {currentSlide.secondary_cta_label && currentSlide.secondary_cta_url && (
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="border-2 border-gold bg-transparent hover:bg-gold/20 hover:shadow-lg hover:shadow-gold/30 text-gold font-semibold px-8 py-6 text-lg transition-all duration-300"
                >
                  <Link href={currentSlide.secondary_cta_url}>
                    {currentSlide.secondary_cta_label}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-16">
            <h2 className="font-serif text-5xl md:text-6xl font-bold mb-4 text-gold tracking-tighter">
              Explore Our Collections
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Signature edits curated for the modern woman
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { name: 'Silk Sarees', slug: 'silk-sarees', desc: 'Timeless elegance' },
              { name: 'Cotton Sarees', slug: 'cotton-sarees', desc: 'Everyday luxury' },
              { name: 'Festive Edit', slug: 'festive-edit', desc: 'Celebration ready' },
            ].map((collection) => (
              <Link key={collection.slug} href={`/collections/${collection.slug}`}>
                <div className="group relative overflow-hidden rounded-lg border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/20 transition-all duration-500 bg-luxury-charcoal">
                  <div className="aspect-[4/5] bg-gradient-to-br from-luxury-charcoal to-black flex items-center justify-center">
                    <div className="text-center p-8">
                      <h3 className="font-serif text-3xl font-bold text-gold mb-2 group-hover:scale-105 transition-transform duration-300">
                        {collection.name}
                      </h3>
                      <p className="text-gray-400">{collection.desc}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button
              size="lg"
              asChild
              className="bg-gold-gradient hover:shadow-xl hover:shadow-gold/40 text-black font-semibold px-8"
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
        <section className="py-24 bg-luxury-charcoal">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="font-serif text-5xl md:text-6xl font-bold mb-4 text-gold tracking-tighter">
                  Most Loved by Samara Women
                </h2>
                <p className="text-lg text-gray-400">
                  Bestsellers chosen by our customers
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mostLovedProducts.map((product) => (
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
                      <div className="absolute top-3 left-3 bg-gold text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Star className="h-3 w-3 fill-current" />
                        {product.bestseller_badge_label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-serif text-lg font-semibold mb-1 line-clamp-1 text-gold">
                        {product.name}
                      </h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                      )}
                      <p className="text-xl font-bold text-gold">
                        ₹{product.base_price_inr.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-24 bg-gradient-to-b from-luxury-charcoal to-black">
          <div className="container mx-auto px-4 md:px-8">
            <div className="flex items-end justify-between mb-16">
              <div>
                <h2 className="font-serif text-5xl md:text-6xl font-bold mb-4 text-gold tracking-tighter">
                  New Arrivals
                </h2>
                <p className="text-lg text-gray-400">
                  Fresh designs just for you
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
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
                      <p className="text-xl font-bold text-gold">
                        ₹{product.base_price_inr.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-24 bg-luxury-charcoal border-t border-gold/20">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold/10 mb-6">
              <Zap className="h-8 w-8 text-gold" />
            </div>
            <h2 className="font-serif text-4xl md:text-5xl font-bold mb-6 text-gold tracking-tighter">
              Experience AI-Powered Try-On
            </h2>
            <p className="text-lg text-gray-400 mb-10 leading-relaxed">
              See how our sarees look on you before making a purchase. Our cutting-edge virtual try-on
              technology brings the boutique experience to your home.
            </p>
            <Button
              size="lg"
              asChild
              className="bg-gold-gradient hover:shadow-xl hover:shadow-gold/40 text-black font-semibold px-8"
            >
              <Link href="/sarees">
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
