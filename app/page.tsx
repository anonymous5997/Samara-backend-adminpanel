// app/page.tsx

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HeroSlider } from '@/components/HeroSlider';
import { CollectionsGrid } from '@/components/CollectionsGrid';
import { ProductSection } from '@/components/ProductSection';
import { getMostLovedProducts, getNewArrivals } from '@/lib/content';
import AutoCurrencyWrapper from '@/components/AutoCurrencyWrapper';
import { createClient } from '@/lib/supabase/server'; // ✅ Added Import

// ✅ STEP 1: Speed Fix - Enabled caching with 60s revalidation
export const revalidate = 60;

export default async function Home() {
  // Existing data fetching
  const mostLovedProducts = await getMostLovedProducts(4);
  const newArrivals = await getNewArrivals(4);

  // ✅ STEP 3: Fetch Hero Data on Server
  const supabase = await createClient();
  const { data: slides } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="bg-[#000000]">
      {/* ✅ Client-only currency detection */}
      <AutoCurrencyWrapper />

      {/* ✅ Pass server-fetched slides to component */}
      <HeroSlider slides={slides ?? []} />

      {mostLovedProducts.length > 0 && (
        <section className="py-20 md:py-24 bg-[#050505]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4">
                Most Loved by Samara Women
              </h2>
              <p className="text-lg text-[#CFCFCF]">
                Discover our bestselling collection
              </p>
            </div>

            <ProductSection products={mostLovedProducts} showBestseller />

            <div className="flex items-center justify-center gap-2 mt-12">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all ${
                    i === 0 ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-[#D4AF37]/30'
                  }`}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-20 md:py-24 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4">
                New Arrivals
              </h2>
              <p className="text-lg text-[#CFCFCF]">
                Fresh designs for the season
              </p>
            </div>

            <ProductSection products={newArrivals} showNew />

            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-bold px-10 py-6"
              >
                <Link href="/shop">
                  View All New Arrivals
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      <section className="py-20 md:py-24 bg-[#050505]">
        <div className="container mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] mb-4">
              Explore Our Collections
            </h2>
            <p className="text-lg text-[#CFCFCF]">
              Signature edits curated for the modern woman
            </p>
          </div>

          <CollectionsGrid />

          <div className="text-center mt-16">
            <Button
              size="lg"
              asChild
              className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-bold px-10 py-6"
            >
              <Link href="/collections">
                View All Collections
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}