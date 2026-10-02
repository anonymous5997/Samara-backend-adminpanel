'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Reveal } from '@/components/motion/Reveal';
import { ListingHero, PieceCount } from '@/components/listing/ListingHero';
import { ListingEmpty } from '@/components/listing/ListingEmpty';
import { CategoryArch } from '@/components/listing/CategoryArch';

interface CollectionCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

const ITEM = 'w-full max-w-[380px] sm:w-[calc(50%-0.75rem)] sm:max-w-none lg:w-[calc((100%-3rem)/3)]';

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
    <div className="min-h-screen bg-samara-black text-samara-ivory">
      {/* Hero */}
      <ListingHero
        eyebrow="Collections"
        title={
          <>
            The <span className="sm-accent">Collections</span>
          </>
        }
        intro="Signature edits from Samara"
        crumbs={[{ label: 'Home', href: '/' }, { label: 'Collections' }]}
        meta={!loading && collections.length > 0 ? <PieceCount count={collections.length} noun="Edits" /> : null}
      />

      {/* Collections grid */}
      <section className="py-[clamp(3.5rem,7vw,6.5rem)]">
        <div className="sm-container">
          {loading ? (
            <div role="status" className="flex flex-wrap justify-center gap-6">
              <span className="sr-only">Loading collections…</span>
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  aria-hidden
                  className={`${ITEM} aspect-[3/4.4] animate-pulse rounded-t-[999px] border border-samara-gold/20 bg-samara-forest/60 motion-reduce:animate-none ${i > 0 ? 'hidden sm:block' : ''} ${i > 1 ? 'sm:hidden lg:block' : ''}`}
                />
              ))}
            </div>
          ) : collections.length === 0 ? (
            <ListingEmpty
              title="No collections configured yet."
              actions={[{ label: 'Browse All Sarees', href: '/sarees', variant: 'ghost' }]}
            />
          ) : (
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-10" aria-label="Collections">
              {collections.map((collection, index) => (
                <li key={collection.id} className={ITEM}>
                  <Reveal delay={Math.min(index, 3) * 120} className="h-full">
                    <CategoryArch
                      href={`/shop?category=${collection.slug}`}
                      name={collection.name}
                      description={collection.description}
                      index={index}
                    />
                  </Reveal>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
