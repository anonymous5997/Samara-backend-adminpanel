'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/motion/Reveal';
import { cn } from '@/lib/utils';
import { HomeProductCard, RAIL_ITEM, RAIL_LIST, RailControls, useHomePrices, useRail } from './HomeProductCard';
import type { ProductWithImages } from './types';

/**
 * New arrivals — forest section with the shared card in dark tone.
 * The page renders it only when the set differs from best sellers.
 */
export function NewArrivalsRail({ products }: { products: ProductWithImages[] }) {
  const prices = useHomePrices(products);
  const rail = useRail(products.length);
  if (products.length === 0) return null;
  const multiple = products.length > 1;

  return (
    <section
      id="new-arrivals"
      aria-labelledby="new-arrivals-title"
      className="scroll-mt-[var(--sm-header-h)] bg-samara-forest py-16 text-samara-ivory sm:py-20 lg:py-24"
    >
      <div className="sm-container">
        <Reveal className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="sm-eyebrow">Just in</p>
            <h2 id="new-arrivals-title" className="sm-display-m mt-4">
              New <span className="sm-accent">Arrivals</span>
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-5">
            {multiple && (
              <RailControls {...rail} count={products.length} tone="dark" label="new arrivals" />
            )}
            <Link
              href="/shop"
              className="sm-link inline-flex min-h-[44px] items-center gap-3 font-sans text-[0.6875rem] font-semibold uppercase tracking-eyebrow text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
            >
              View all
              <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.25} />
            </Link>
          </div>
        </Reveal>

        <ul ref={rail.ref} className={cn(RAIL_LIST, 'mt-12 lg:mt-14')} aria-label="New arrivals">
          {products.map((product, i) => (
            <li key={product.id} className={cn(RAIL_ITEM, !multiple && 'sm:w-[min(20rem,48%)]')}>
              <Reveal delay={Math.min(i, 4) * 110}>
                <HomeProductCard product={product} index={i} price={prices[String(product.id)]} tone="dark" />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
