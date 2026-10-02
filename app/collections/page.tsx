'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight } from 'lucide-react';

interface CollectionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<CollectionCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCollections() {
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description, is_active')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCollections(
          data.map((c) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description ?? '',
          }))
        );
      }

      setLoading(false);
    }

    fetchCollections();
  }, []);

  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      {/* Hero */}
      <section className="mb-20">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 text-center max-w-4xl">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Signature Edits
          </span>
          <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl mb-6">
            Our <em className="italic text-samara-gold">Collections</em>
          </h1>
          <p className="text-sm md:text-base font-sans text-samara-ivory/60 leading-relaxed max-w-lg mx-auto">
            Discover curated selections that celebrate heritage craftsmanship, designed for the modern era.
          </p>
        </div>
      </section>

      {/* Collections grid */}
      <section>
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto">
               {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-[3/4] bg-samara-void1 animate-pulse" />
               ))}
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-24 border border-samara-ivory/10 bg-samara-void1/50 max-w-2xl mx-auto">
              <p className="text-sm font-sans tracking-widest text-samara-ivory/40 uppercase">
                No collections available
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
              {collections.map((collection, index) => (
                <Link
                  key={collection.id}
                  href={`/shop?category=${collection.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden bg-samara-void1 border border-samara-gold/10 hover:border-samara-gold/30 transition-all duration-500">
                    
                    {/* Aspect ratio container */}
                    <div className="aspect-[3/4] flex flex-col items-center justify-center p-6 md:p-10 relative">
                      
                      {/* Number */}
                      <span className="absolute top-4 left-4 text-[11px] font-sans tracking-[0.2em] text-samara-gold/40">
                        {String(index + 1).padStart(2, '0')}
                      </span>

                      {/* Collection Name */}
                      <h3 className="font-serif text-xl sm:text-2xl md:text-3xl text-samara-ivory text-center group-hover:text-samara-gold transition-colors duration-300 leading-tight">
                        {collection.name}
                      </h3>
                      
                      {collection.description && (
                        <p className="text-xs font-sans text-samara-ivory/50 text-center mt-3 line-clamp-2 max-w-[200px]">
                          {collection.description}
                        </p>
                      )}

                      {/* Explore CTA */}
                      <div className="mt-6 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold">Explore</span>
                        <ArrowRight className="w-3.5 h-3.5 text-samara-gold group-hover:translate-x-1 transition-transform duration-300" />
                      </div>

                      {/* Bottom gold line */}
                      <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-samara-gold group-hover:w-full transition-all duration-500" />
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