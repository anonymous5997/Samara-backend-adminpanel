'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export function CollectionsGrid() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCategories() {
      setLoading(true);

      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug, description')
        .eq('is_active', true)
        .order('name');

      if (!error && data) {
        setCategories(data);
      }

      setLoading(false);
    }

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-400">Loading collections…</div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 max-w-7xl mx-auto">
      {categories.map((collection) => (
        <Link
          key={collection.id}
          href={`/shop?category=${collection.slug}`}
        >
          <div className="group relative overflow-hidden rounded-2xl border-2 border-[#D4AF37]/20 hover:border-[#D4AF37]/70 hover:shadow-2xl hover:shadow-[#D4AF37]/30 transition-all duration-500 bg-gradient-to-b from-[#1a1a1a] to-[#0d0d0d] h-full hover:-translate-y-1">
            <div className="aspect-[3/4] flex flex-col items-center justify-center p-6">
              <h3 className="font-serif text-xl md:text-2xl font-semibold text-[#D4AF37] text-center group-hover:text-[#F4D03F] transition-colors duration-300">
                {collection.name}
              </h3>

              {collection.description && (
                <p className="text-gray-400 text-sm text-center mt-3">
                  {collection.description}
                </p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
