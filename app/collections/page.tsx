'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getAllCollections } from '@/lib/content';
import type { Collection } from '@/lib/content';
import { ArrowRight } from 'lucide-react';

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
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading collections...</p>
      </div>
    );
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <section className="py-24 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-16 text-center">
            <h1 className="font-serif text-6xl md:text-7xl font-bold mb-6 text-gold tracking-tighter">
              Collections
            </h1>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
              Signature edits from Samara
            </p>
          </div>

          {collections.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-500">No collections available at the moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {collections.map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.slug}`}>
                  <div className="group relative overflow-hidden rounded-lg border-2 border-gold/20 hover:border-gold hover:shadow-2xl hover:shadow-gold/20 transition-all duration-500 bg-luxury-charcoal h-full">
                    {collection.hero_image_url ? (
                      <div className="aspect-[4/5] overflow-hidden bg-luxury-charcoal">
                        <img
                          src={collection.hero_image_url}
                          alt={collection.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/5] bg-gradient-to-br from-luxury-charcoal to-black flex items-center justify-center">
                        <div className="text-center p-8">
                          <h3 className="font-serif text-3xl font-bold text-gold mb-2 group-hover:scale-105 transition-transform duration-300">
                            {collection.name}
                          </h3>
                        </div>
                      </div>
                    )}
                    <div className="p-6">
                      <h2 className="font-serif text-2xl font-bold mb-3 text-gold group-hover:scale-105 transition-transform">
                        {collection.name}
                      </h2>
                      {collection.description && (
                        <p className="text-gray-400 line-clamp-2 mb-4">
                          {collection.description}
                        </p>
                      )}
                      <div className="inline-flex items-center text-gold font-semibold group-hover:gap-2 transition-all">
                        Explore Collection
                        <ArrowRight className="ml-1 h-4 w-4 group-hover:ml-2 transition-all" />
                      </div>
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
