import AutoCurrencyWrapper from '@/components/AutoCurrencyWrapper';
import { Marquee } from '@/components/motion/Marquee';
import { getHomeData } from '@/components/home/data';
import { HomeHero } from '@/components/home/HomeHero';
import { IntroCurtain } from '@/components/home/IntroCurtain';
import { TrustStrip } from '@/components/home/TrustStrip';
import { CollectionsArches } from '@/components/home/CollectionsArches';
import { ShopByCategory } from '@/components/home/ShopByCategory';
import { HomeIntro } from '@/components/home/HomeIntro';
import { BestSellers } from '@/components/home/BestSellers';
import { NewArrivalsRail } from '@/components/home/NewArrivalsRail';
import { StoryBlock } from '@/components/home/StoryBlock';
import { ClosingStatement } from '@/components/home/ClosingStatement';
import { HOME_COPY } from '@/config/homepage';

// Speed: cache with 60s revalidation (unchanged).
export const revalidate = 60;

/**
 * Homepage — editorial sequence. Every section reads real data and renders
 * nothing (or a type-only layout) when its data is missing.
 *   01 Hero (Admin → Hero Slides)      05 Samara intro (Google OAuth H1)
 *   02 Trust strip                     06 Best sellers (is_bestseller)
 *   03 Collections (collections)       07 New arrivals (only if distinct)
 *   04 Shop by category (categories)   08 Marquee · 09 Story · 10 Closing
 */
export default async function Home() {
  const data = await getHomeData();

  return (
    <div className="bg-samara-black">
      <AutoCurrencyWrapper />
      <IntroCurtain />

      <HomeHero slides={data.heroSlides} />
      <TrustStrip />
      {data.collections.length > 0 && <CollectionsArches collections={data.collections} />}
      {data.categories.length > 0 && <ShopByCategory categories={data.categories} />}
      <HomeIntro />
      {data.bestsellers.length > 0 && <BestSellers products={data.bestsellers} />}
      {data.newArrivalsDistinct && <NewArrivalsRail products={data.newArrivals} />}

      <Marquee
        items={[...HOME_COPY.marquee]}
        className="border-y border-samara-line bg-samara-black py-6 text-[0.6875rem] font-medium uppercase tracking-eyebrow text-samara-mute"
      />

      <StoryBlock />
      <ClosingStatement />
    </div>
  );
}
