import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
}

export async function CollectionsGrid() {
  const supabase = await createClient();

  // ✅ Fetch categories server-side
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('name');

  // ✅ Handle empty state
  if (!categories || categories.length === 0) {
    return (
      <div className="text-center py-10 text-gray-400">
        No collections found.
      </div>
    );
  }

  // ✅ Render Grid
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