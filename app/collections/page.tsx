'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCollections } from '@/lib/content';
import type { Collection } from '@/lib/content';
import { Card, CardContent } from '@/components/ui/card';

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCollections();
  }, []);

  const loadCollections = async () => {
    try {
      const data = await getAllCollections();
      setCollections(data);
    } catch (error) {
      console.error('Error loading collections:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <p className="text-center text-neutral-600">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold mb-4">Our Collections</h1>
        <p className="text-neutral-600 text-lg">
          Explore our curated collections of exquisite sarees
        </p>
      </div>

      {collections.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-neutral-500">
            No collections available at the moment.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {collections.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.slug}`}>
              <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden h-full">
                {collection.hero_image_url && (
                  <div className="aspect-[4/3] overflow-hidden bg-neutral-100">
                    <img
                      src={collection.hero_image_url}
                      alt={collection.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                )}
                <CardContent className="p-6">
                  <h2 className="text-2xl font-bold mb-3 group-hover:text-amber-600 transition-colors">
                    {collection.name}
                  </h2>
                  {collection.description && (
                    <p className="text-neutral-600 line-clamp-2">
                      {collection.description}
                    </p>
                  )}
                  <div className="mt-4 inline-flex items-center text-amber-600 font-semibold group-hover:gap-2 transition-all">
                    Explore Collection
                    <span className="ml-1 group-hover:ml-2 transition-all">→</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
