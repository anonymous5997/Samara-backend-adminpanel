import { HeroSlider } from '@/components/HeroSlider';
import { Marquee } from '@/components/Marquee';
import { MostLovedEditorial } from '@/components/MostLovedEditorial';
import { FullBleedStory } from '@/components/FullBleedStory';
import { CollectionsEditorial } from '@/components/CollectionsEditorial';
import { ProductRail } from '@/components/ProductRail';
import { getMostLovedProducts, getNewArrivals } from '@/lib/content';
import AutoCurrencyWrapper from '@/components/AutoCurrencyWrapper';
import { createClient } from '@/lib/supabase/server';
import { ShieldCheck, Truck, RefreshCw, Award } from 'lucide-react';

// ✅ Speed Fix - Enabled caching with 60s revalidation
export const revalidate = 60;

export default async function Home() {
  const mostLovedProducts = await getMostLovedProducts(4);
  const newArrivals = await getNewArrivals(4);

  // Fetch Hero Data on Server
  const supabase = await createClient();
  const { data: slides } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="bg-samara-void">
      {/* Client-only currency detection */}
      <AutoCurrencyWrapper />

      {/* ═══════════════════════════════════════════════════════════════
          BRAND PURPOSE (Required for Google OAuth compliance)
          Hidden visually but present in DOM for accessibility & OAuth
      ═══════════════════════════════════════════════════════════════ */}
      <section className="sr-only" aria-label="About Samara">
        <h1>Samara</h1>
        <p>
          Samara is an online fashion and e-commerce platform that allows users
          to browse and purchase handcrafted Sambalpuri sarees and traditional
          Indian apparel. Users can create accounts or sign in using email,
          Google, or Facebook to manage their profiles, delivery addresses,
          and orders.
        </p>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          01 — HERO — Full-viewport cinematic photography
      ═══════════════════════════════════════════════════════════════ */}
      <HeroSlider slides={slides ?? []} />

      {/* ═══════════════════════════════════════════════════════════════
          02 — MARQUEE BAND — Continuously scrolling editorial typography
      ═══════════════════════════════════════════════════════════════ */}
      <Marquee />

      {/* ═══════════════════════════════════════════════════════════════
          03 — MOST LOVED — Editorial product presentation
      ═══════════════════════════════════════════════════════════════ */}
      {mostLovedProducts.length > 0 && (
        <MostLovedEditorial products={mostLovedProducts} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          04 — FULL-BLEED STORY — Large image + typography
      ═══════════════════════════════════════════════════════════════ */}
      <FullBleedStory />

      {/* ═══════════════════════════════════════════════════════════════
          05 — COLLECTIONS — Asymmetric editorial composition
      ═══════════════════════════════════════════════════════════════ */}
      <CollectionsEditorial />

      {/* ═══════════════════════════════════════════════════════════════
          06 — PRODUCT RAIL — Horizontal product interaction
      ═══════════════════════════════════════════════════════════════ */}
      {newArrivals.length > 0 && (
        <ProductRail products={newArrivals} />
      )}

      {/* ═══════════════════════════════════════════════════════════════
          07 — TRUST STRIP — Minimal factual trust strip
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-samara-void border-t border-samara-gold/10">
        <div className="container mx-auto px-6 md:px-12 lg:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-16 max-w-5xl mx-auto">
            <div className="text-center space-y-3">
              <Award className="w-6 h-6 text-samara-gold mx-auto stroke-[1.2]" />
              <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/80">100% Authentic</p>
              <p className="text-[9px] font-sans text-samara-ivory/40">Certified Handloom</p>
            </div>
            <div className="text-center space-y-3">
              <Truck className="w-6 h-6 text-samara-gold mx-auto stroke-[1.2]" />
              <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/80">Free Shipping</p>
              <p className="text-[9px] font-sans text-samara-ivory/40">Pan India Delivery</p>
            </div>
            <div className="text-center space-y-3">
              <RefreshCw className="w-6 h-6 text-samara-gold mx-auto stroke-[1.2]" />
              <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/80">Easy Returns</p>
              <p className="text-[9px] font-sans text-samara-ivory/40">7-Day Policy</p>
            </div>
            <div className="text-center space-y-3">
              <ShieldCheck className="w-6 h-6 text-samara-gold mx-auto stroke-[1.2]" />
              <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/80">Secure Checkout</p>
              <p className="text-[9px] font-sans text-samara-ivory/40">SSL Encrypted</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}