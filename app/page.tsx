import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product-card';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight } from 'lucide-react';

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
  const featuredProducts = await getFeaturedProducts();
  const categories = await getCategories();

  return (
    <div>
      <section className="relative h-[600px] bg-gradient-to-br from-gray-900 to-gray-700 text-white">
        <div className="container mx-auto px-4 h-full flex items-center">
          <div className="max-w-2xl">
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Discover Your Style with Samara
            </h1>
            <p className="text-xl mb-8 text-gray-200">
              Premium fashion and lifestyle products curated just for you
            </p>
            <div className="flex gap-4">
              <Button size="lg" asChild>
                <Link href="/shop">
                  Shop Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="bg-white text-gray-900 hover:bg-gray-100">
                <Link href="/new-arrivals">New Arrivals</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {categories.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Shop by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/shop?category=${category.slug}`}
                  className="group"
                >
                  <div className="aspect-square rounded-lg bg-white border-2 border-gray-200 hover:border-gray-900 transition-colors flex items-center justify-center p-6">
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

      <section className="py-16">
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

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Try Before You Buy</h2>
            <p className="text-lg text-gray-600 mb-8">
              Use our AI-powered virtual try-on feature to see how products look on you before making a purchase
            </p>
            <Button size="lg" asChild>
              <Link href="/shop">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
