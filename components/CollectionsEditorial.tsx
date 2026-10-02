import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ArrowRight } from 'lucide-react';

export async function CollectionsEditorial() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from('categories')
    .select('id, name, slug, description')
    .eq('is_active', true)
    .order('name')
    .limit(4); // Only show top 4 for editorial layout

  if (!categories || categories.length === 0) return null;

  // Fallback images to give that premium look
  const fallbacks = [
    '/img_2599.jpeg',
    '/img_2601.jpeg',
    '/img_2599 copy.jpeg',
    '/img_2601.jpeg',
  ];

  return (
    <section className="py-24 md:py-32 bg-samara-void1">
      <div className="container mx-auto px-6 md:px-12 lg:px-16">
        
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 md:mb-24">
          <div>
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold block mb-4">
              Browse By
            </span>
            <h2 className="font-serif text-4xl md:text-6xl text-samara-ivory">
              Our <em className="italic font-light text-samara-gold">Collections</em>
            </h2>
          </div>
        </div>

        {/* Asymmetrical Layout for 4 items */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
          {categories.map((collection, idx) => {
            // Asymmetrical sizing
            let colSpan = 'md:col-span-6';
            let aspectRatio = 'aspect-[4/5]';
            let margin = '';

            if (idx === 0) {
              colSpan = 'md:col-span-5';
              aspectRatio = 'aspect-[3/4]';
            } else if (idx === 1) {
              colSpan = 'md:col-span-6 md:col-start-7';
              aspectRatio = 'aspect-[4/5]';
              margin = 'md:mt-32';
            } else if (idx === 2) {
              colSpan = 'md:col-span-7';
              aspectRatio = 'aspect-[16/9]';
            } else if (idx === 3) {
              colSpan = 'md:col-span-4 md:col-start-9';
              aspectRatio = 'aspect-[3/4]';
              margin = 'md:-mt-48 relative z-10';
            }

            return (
              <div key={collection.id} className={`${colSpan} ${margin} group`}>
                <Link href={`/shop?category=${collection.slug}`} className="block">
                  <div className={`relative overflow-hidden ${aspectRatio} bg-samara-void mb-6`}>
                    <img 
                      src={fallbacks[idx % fallbacks.length]} 
                      alt={collection.name}
                      className="w-full h-full object-cover object-[center_20%] scale-105 group-hover:scale-100 transition-transform duration-[10000ms] ease-out"
                    />
                    <div className="absolute inset-0 bg-samara-void/20 group-hover:bg-transparent transition-colors duration-700" />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-serif text-2xl md:text-3xl text-samara-ivory group-hover:text-samara-gold transition-colors duration-300">
                        {collection.name}
                      </h3>
                      {collection.description && (
                        <p className="text-xs font-sans text-samara-ivory/60 mt-2 line-clamp-1 max-w-sm">
                          {collection.description}
                        </p>
                      )}
                    </div>
                    <ArrowRight className="w-5 h-5 text-samara-ivory/40 group-hover:text-samara-gold group-hover:translate-x-2 transition-all duration-300" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
        
      </div>
    </section>
  );
}
