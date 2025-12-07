'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { getCollectionBySlug, getCollectionProducts } from '@/lib/content';
import type { Collection, ProductWithImages } from '@/lib/content';
import { Card, CardContent } from '@/components/ui/card';

export default function CollectionDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [collection, setCollection] = useState<Collection | null>(null);
  const [products, setProducts] = useState<ProductWithImages[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollectionData();
  }, [slug]);

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-neutral-600">Loading collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
            <p className="text-neutral-600 mb-4">
              The collection you're looking for doesn't exist.
            </p>
            <Link href="/collections" className="text-amber-600 hover:underline">
              Browse All Collections
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {collection.hero_image_url && (
        <div className="relative h-80 bg-neutral-900 overflow-hidden">
          <img
            src={collection.hero_image_url}
            alt={collection.name}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center px-4">
            <h1 className="text-5xl font-bold mb-4">
              {collection.hero_title || collection.name}
            </h1>
            {collection.hero_subtitle && (
              <p className="text-xl">{collection.hero_subtitle}</p>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12">
        {!collection.hero_image_url && (
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4">{collection.name}</h1>
            {collection.description && (
              <p className="text-neutral-600 text-lg">{collection.description}</p>
            )}
          </div>
        )}

        {products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-neutral-500">
              No products in this collection yet.
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <Link key={product.id} href={`/products/${product.slug}`}>
                <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
                  <div className="aspect-[3/4] overflow-hidden bg-gray-100 relative">
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
                      <p className="text-sm text-gray-500 mb-2">{product.brand}</p>
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
    </div>
  );
}
