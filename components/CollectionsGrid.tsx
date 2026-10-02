import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';

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
      <div className="text-center py-10 text-samara-ivory/40">
        No collections found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-7xl mx-auto">
      {categories.map((collection, index) => (
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
  );
}