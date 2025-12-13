// app/page.tsx

import Link from 'next/link';
import nextdynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { HeroSlider } from '@/components/HeroSlider';
import { SectionHeading } from '@/components/SectionHeading';
import { CollectionsGrid } from '@/components/CollectionsGrid';
// import { AITryOn } from '@/components/AITryOn'; // kept commented out
import { ProductSection } from '@/components/ProductSection';
import { getMostLovedProducts, getNewArrivals } from '@/lib/content';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// dynamically load the client-only component that runs the auto-currency hook
const AutoCurrencyClient = nextdynamic(
  () => import('@/components/AutoCurrencyClient'),
  { ssr: false }
);

export default async function Home() {
  const mostLovedProducts = await getMostLovedProducts(4);
  const newArrivals = await getNewArrivals(4);

  return (
    <div className="bg-[#000000]">
      {/* Client-only auto-currency runner (doesn't render anything) */}
      <AutoCurrencyClient />

      <HeroSlider />

      {mostLovedProducts.length > 0 && (
        <section className="py-20 md:py-24 bg-[#050505]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
                Most Loved by Samara Women
              </h2>
              <p className="text-lg text-[#CFCFCF]">
                Discover our bestselling collection
              </p>
            </div>
            <ProductSection products={mostLovedProducts} showBestseller={true} />
            <div className="flex items-center justify-center gap-2 mt-12">
              <div className="flex gap-2">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      index === 0 ? 'w-8 bg-[#D4AF37]' : 'w-2 bg-[#D4AF37]/30'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {newArrivals.length > 0 && (
        <section className="py-20 md:py-24 bg-gradient-to-b from-[#000000] via-[#050505] to-[#000000]">
          <div className="container mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
                New Arrivals
              </h2>
              <p className="text-lg text-[#CFCFCF]">Fresh designs for the season</p>
            </div>
            <ProductSection products={newArrivals} showNew={true} />
            <div className="text-center mt-12">
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-2 border-[#D4AF37] bg-transparent hover:bg-[#D4AF37]/10 hover:shadow-lg hover:shadow-[#D4AF37]/50 text-[#D4AF37] font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
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
            <h2 className="font-serif text-4xl md:text-5xl font-bold text-[#D4AF37] heading-line-height mb-4">
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
              className="bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold px-10 py-6 text-lg hover:scale-105 transition-all duration-300"
            >
              <Link href="/collections">
                View All Collections
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* <AITryOn /> */}
    </div>
  );
}
