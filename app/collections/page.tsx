'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

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
    <div className="bg-black text-white min-h-screen">
      {/* Hero */}
      {/* ✅ STEP 1: Reduced padding on mobile (py-10 vs py-16) */}
      <section className="py-10 sm:py-14 md:py-20 bg-gradient-to-b from-black to-[#0b0b0b] border-b border-[#D4AF37]/10">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center max-w-4xl mx-auto">
            {/* ✅ STEP 1: Reduced margin bottom on mobile (mb-3 vs mb-6) */}
            <h1 className="font-serif text-6xl md:text-7xl lg:text-8xl font-bold mb-3 sm:mb-6 text-transparent bg-clip-text bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] tracking-tighter">
              Collections
            </h1>
            {/* ✅ STEP 1: Reduced text size on mobile (text-base vs text-xl) */}
            <p className="text-base sm:text-xl md:text-2xl text-gray-300 leading-relaxed">
              Signature edits from Samara
            </p>
          </div>
        </div>
      </section>

      {/* Collections grid */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4 md:px-8">
          {loading ? (
            <div className="text-center py-16 text-gray-500">
              Loading collections…
            </div>
          ) : collections.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              No collections configured yet.
            </div>
          ) : (
            /* ✅ STEP 2: Grid cols 2 on mobile, reduced gap (gap-3 vs gap-6) */
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 max-w-7xl mx-auto">
              {collections.map((collection) => (
                <Link
                  key={collection.id}
                  href={`/shop?category=${collection.slug}`}
                >
                  {/* ✅ STEP 5: Hover lift disabled on mobile (sm:hover:-translate-y-1) */}
                  <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/70 hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] h-full sm:hover:-translate-y-1">
                    
                    {/* ✅ STEP 3: Reduced height (aspect-[4/5]), reduced padding (p-4), reduced spacing (space-y-2) */}
                    <div className="aspect-[4/5] sm:aspect-[3/4] flex flex-col items-center justify-center p-4 sm:p-8 space-y-2 sm:space-y-4">
                      
                      {/* ✅ STEP 4: Reduced text size (text-sm), added line-clamp-2 */}
                      <h2 className="font-serif text-sm sm:text-2xl md:text-3xl font-semibold text-[#D4AF37] text-center group-hover:text-[#F4D03F] transition-colors duration-300 line-clamp-2">
                        {collection.name}
                      </h2>
                      
                      {collection.description && (
                        /* ✅ STEP 4: Reduced description size (text-xs), added line-clamp-2 */
                        <p className="text-xs sm:text-sm text-gray-400 text-center leading-relaxed line-clamp-2">
                          {collection.description}
                        </p>
                      )}
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