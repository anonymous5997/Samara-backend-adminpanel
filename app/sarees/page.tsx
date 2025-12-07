'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSareeProducts } from '@/lib/content';
import type { ProductWithImages } from '@/lib/content';
import { Card, CardContent } from '@/components/ui/card';

export default function SareesPage() {
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await getSareeProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error loading sarees:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-neutral-600">Loading sarees...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Sarees Collection</h1>
        <p className="text-neutral-600">
          Discover our exquisite collection of handcrafted sarees
        </p>
      </div>

      {products.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No sarees available at the moment. Please check back later.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/products/${product.slug}`}>
              <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                <div className="aspect-[3/4] overflow-hidden bg-neutral-100 relative">
                  {product.primary_image_url ? (
                    <img
                      src={product.primary_image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400">
                      No Image
                    </div>
                  )}
                  {product.is_bestseller && (
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      {product.bestseller_badge_label}
                    </div>
                  )}
                  {product.is_new_arrival && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      New
                    </div>
                  )}
                </div>
                <CardContent className="p-4">
                  <h3 className="font-semibold text-lg mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  {product.brand && (
                    <p className="text-sm text-neutral-500 mb-2">{product.brand}</p>
                  )}
                  <p className="text-lg font-bold text-amber-600">
                    ₹{product.base_price_inr.toLocaleString('en-IN')}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
