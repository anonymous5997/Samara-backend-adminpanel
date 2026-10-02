'use client';

import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import { HomeProductCard, RAIL_ITEM, RAIL_LIST, RailControls, useHomePrices, useRail } from './HomeProductCard';
import type { ProductWithImages } from './types';

/**
 * Best sellers — cream band. Heading + "01 — 0N" counter on the left,
 * a scroll-snap row of product cards on the right (stacked below lg).
 */
export function BestSellers({ products }: { products: ProductWithImages[] }) {
  const prices = useHomePrices(products);
  const rail = useRail(products.length);
  if (products.length === 0) return null;
  const multiple = products.length > 1;

  return (
    <section
      id="best-sellers"
      aria-labelledby="best-sellers-title"
      className="scroll-mt-[var(--sm-header-h)] bg-samara-cream py-16 text-samara-cream-ink sm:py-20 lg:py-24"
    >
      <div className="sm-container grid gap-10 lg:grid-cols-[minmax(13rem,16rem)_1fr] lg:gap-12 xl:gap-16">
        <Reveal className="flex flex-col">
          <h2
            id="best-sellers-title"
            className="font-serif text-[2.25rem] font-normal uppercase leading-[0.98] tracking-[0.01em] text-samara-cream-ink sm:text-[2.75rem] lg:text-[3.25rem]"
          >
            Best Sellers
          </h2>
          <p className="mt-4 max-w-[22rem] font-sans text-[0.875rem] leading-relaxed text-samara-cream-mute">
            The pieces our customers return to.
          </p>
          <span aria-hidden className="mt-7 hidden h-px w-10 bg-samara-cream-ink/30 lg:block" />
          {multiple && (
            <RailControls
              {...rail}
              count={products.length}
              label="best sellers"
              className="mt-8 lg:mt-auto lg:pt-10"
            />
          )}
        </Reveal>

        <ul ref={rail.ref} className={RAIL_LIST} aria-label="Best sellers">
          {products.map((product, i) => (
            <li key={product.id} className={cn(RAIL_ITEM, !multiple && 'sm:w-[min(20rem,48%)]')}>
              <Reveal delay={Math.min(i, 4) * 110}>
                <HomeProductCard product={product} index={i} price={prices[String(product.id)]} />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
