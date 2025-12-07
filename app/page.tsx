import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight, Star, Sparkles } from 'lucide-react';
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

async function getCategories() {
  const { data } = await supabase
    .from('categories')
    .select('*')
    .eq('is_active', true)
    .is('parent_id', null)
    .limit(6);

  return data || [];
}

export default async function Home() {
  const [heroSlides, mostLovedProducts, newArrivals, featuredProducts, categories] = await Promise.all([
    getHomeHeroSlides(),
    getMostLovedProducts(4),
    getNewArrivals(4),
    getFeaturedProducts(),
    getCategories(),
  ]);

  const currentSlide = heroSlides[0] || {
    title: 'Discover Your Style with Samara',
    subtitle: 'Premium fashion and lifestyle products curated just for you',
    primary_cta_label: 'Shop Now',
    primary_cta_url: '/shop',
    secondary_cta_label: 'New Arrivals',
    secondary_cta_url: '/shop',
    image_url: null,
  };

  return (
    <div>
      <section
        className="relative h-[600px] text-white overflow-hidden"
        style={{
          backgroundImage: currentSlide.image_url
            ? `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${currentSlide.image_url})`
            : 'linear-gradient(to bottom right, rgb(17, 24, 39), rgb(55, 65, 81))',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {currentSlide.title}
            </h1>
            {currentSlide.subtitle && (
              <p className="text-xl mb-8 text-gray-200">
                {currentSlide.subtitle}
              </p>
            )}
            <div className="flex gap-4">
              {currentSlide.primary_cta_label && currentSlide.primary_cta_url && (
                <Button size="lg" asChild>
                  <Link href={currentSlide.primary_cta_url}>
                    {currentSlide.primary_cta_label}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              )}
              {currentSlide.secondary_cta_label && currentSlide.secondary_cta_url && (
                <Button size="lg" variant="outline" asChild className="bg-white text-gray-900 hover:bg-gray-100">
                  <Link href={currentSlide.secondary_cta_url}>
                    {currentSlide.secondary_cta_label}
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {mostLovedProducts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">Most Loved by Samara Women</h2>
                <p className="text-gray-600">Bestsellers chosen by our customers</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/shop">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {mostLovedProducts.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                        <Star className="h-3 w-3 fill-white" />
                        {product.bestseller_badge_label}
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                      )}
                      <p className="text-lg font-bold text-amber-600">
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
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold mb-2">New Arrivals</h2>
                <p className="text-gray-600">Fresh designs just for you</p>
              </div>
              <Button variant="outline" asChild>
                <Link href="/shop">View All</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {newArrivals.map((product) => (
                <Link key={product.id} href={`/products/${product.slug}`}>
                  <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-all">
                    <div className="aspect-[3/4] relative overflow-hidden bg-gray-100">
                      {product.primary_image_url ? (
                        <img
                          src={product.primary_image_url}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No Image
                        </div>
                      )}
                      {product.is_new_arrival && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                          <Sparkles className="h-3 w-3" />
                          New
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1 line-clamp-1">{product.name}</h3>
                      {product.brand && (
                        <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
                      )}
                      <p className="text-lg font-bold text-amber-600">
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

      {categories.length > 0 && (
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group"
                >
                  <div className="aspect-square rounded-lg bg-white border-2 border-gray-200 hover:border-amber-500 transition-colors flex items-center justify-center p-6">
                    <h3 className="text-center font-medium group-hover:scale-105 transition-transform">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-bold">Featured Products</h2>
            <Button variant="outline" asChild>
              <Link href="/shop">View All</Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {featuredProducts.map(({ product, image }) => (
              <ProductCard
                key={product.id}
                product={product}
                image={image}
                currency="INR"
                rate={1}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-amber-50 border-t border-amber-100">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Explore Our Collections</h2>
            <p className="text-lg text-gray-600 mb-8">
              Discover curated collections of handcrafted sarees for every occasion
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" asChild className="bg-amber-600 hover:bg-amber-700">
                <Link href="/collections">View Collections</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/sarees">Browse All Sarees</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
