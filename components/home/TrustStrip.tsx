import Link from 'next/link';
import { Globe, RotateCcw, ShieldCheck, Truck, type LucideIcon } from 'lucide-react';
import { TRUST_ITEMS } from '@/config/homepage';
import { cn } from '@/lib/utils';

const ICONS: Record<(typeof TRUST_ITEMS)[number]['icon'], LucideIcon> = {
  shield: ShieldCheck,
  truck: Truck,
  rotate: RotateCcw,
  globe: Globe,
};

const ITEM_INNER =
  'flex h-full flex-col items-start gap-3 px-4 py-6 sm:flex-row sm:items-center sm:gap-4 sm:px-6 lg:justify-center lg:gap-3 lg:px-4 lg:py-7 xl:gap-4 xl:px-8';

/**
 * Slim cream band under the hero. Only claims the app actually supports
 * (config/homepage.ts → TRUST_ITEMS). 2×2 grid on mobile, one row on desktop.
 */
export function TrustStrip() {
  const last = TRUST_ITEMS.length - 1;

  return (
    <section aria-label="Shopping with Samara" className="bg-samara-cream text-samara-cream-ink">
      <ul className="sm-container grid grid-cols-2 lg:grid-cols-4">
        {TRUST_ITEMS.map((item, i) => {
          const Icon = ICONS[item.icon];
          const content = (
            <>
              <Icon aria-hidden className="h-6 w-6 shrink-0 text-samara-gold-deep" strokeWidth={1.25} />
              <span className="flex min-w-0 flex-col gap-1">
                <span
                  className={cn(
                    'text-[0.6875rem] font-semibold uppercase leading-snug tracking-[0.2em] text-samara-cream-ink lg:tracking-[0.14em] xl:tracking-[0.2em]',
                    item.href && 'sm-link self-start',
                  )}
                >
                  {item.title}
                </span>
                <span className="text-[0.75rem] leading-snug text-samara-cream-mute">{item.detail}</span>
              </span>
            </>
          );

          return (
            <li
              key={item.title}
              className={cn(
                'border-samara-cream-2',
                // mobile 2×2: divider after the left column, under the top row
                i % 2 === 0 && i !== last && 'border-r',
                i < 2 && 'border-b lg:border-b-0',
                // desktop single row: divider between every item
                i !== last ? 'lg:border-r' : 'lg:border-r-0',
              )}
            >
              {item.href ? (
                <Link
                  href={item.href}
                  className={cn(
                    ITEM_INNER,
                    'focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-samara-gold-deep',
                  )}
                >
                  {content}
                </Link>
              ) : (
                <div className={ITEM_INNER}>{content}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
