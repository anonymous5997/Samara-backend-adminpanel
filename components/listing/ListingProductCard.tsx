import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { formatPriceSync, type SupportedCurrency } from '@/lib/currency-utils';
import type { ProductWithImages } from '@/lib/content';

/**
 * Listing product card — dark tone, same family as
 * components/home/HomeProductCard.tsx. Purely presentational: the page
 * resolves the price and decides the badges; this only renders them.
 * Hook-free so it works in server and client pages alike.
 */

export interface ListingPrice {
  price: number;
  currency: SupportedCurrency;
  mrp?: number | null;
}

/** Grid used by every listing page: 2 / 3 / 4 columns. */
export const LISTING_GRID =
  'grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-5 md:grid-cols-3 md:gap-x-6 md:gap-y-14 lg:grid-cols-4';

const OPTIMIZED_HOSTS = new Set(['wrsrobuicquzpfgnfnmh.supabase.co', 'images.pexels.com']);

function usable(url: string | null | undefined): url is string {
  return typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder.com');
}

function isOptimizable(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && OPTIMIZED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/** Primary photo plus an optional second photo for the hover crossfade. */
function productImages(product: ProductWithImages): { primary: string | null; secondary: string | null } {
  const all = (product.images ?? []).map((img) => img.image_url).filter(usable);
  const primary = usable(product.primary_image_url) ? product.primary_image_url : all[0] ?? null;
  const secondary = all.find((url) => url !== primary) ?? null;
  return { primary, secondary };
}

interface ListingProductCardProps {
  product: ProductWithImages;
  index: number;
  /** Undefined while the price is still resolving (renders a quiet placeholder). */
  price: ListingPrice | undefined;
  /** Already-decided labels, e.g. ["Bestseller"], ["New"]. */
  badges?: string[];
  sizes?: string;
}

export function ListingProductCard({
  product,
  index,
  price,
  badges = [],
  sizes = '(min-width: 1024px) 24vw, (min-width: 768px) 31vw, 47vw',
}: ListingProductCardProps) {
  const { primary, secondary } = productImages(product);
  const showMrp = !!price && typeof price.mrp === 'number' && price.mrp > price.price;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group block focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
    >
      <span className="sm-zoom relative block aspect-[4/5] w-full bg-samara-forest-2">
        {primary ? (
          <>
            <Image
              src={primary}
              alt={product.name}
              fill
              sizes={sizes}
              unoptimized={!isOptimizable(primary)}
              className="object-cover"
            />
            {secondary && (
              <Image
                src={secondary}
                alt=""
                fill
                sizes={sizes}
                unoptimized={!isOptimizable(secondary)}
                className="hidden object-cover opacity-0 transition-opacity duration-900 ease-editorial lg:block [@media(hover:hover)_and_(pointer:fine)]:group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <span
            aria-hidden
            className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-light text-samara-mute"
          >
            {product.name.trim().charAt(0).toUpperCase()}
          </span>
        )}

        {badges.length > 0 && (
          <span className="absolute left-0 top-0 flex flex-col items-start gap-px">
            {badges.map((label) => (
              <span
                key={label}
                className="bg-samara-ink/[0.85] px-2.5 py-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-ivory sm:px-3"
              >
                {label}
              </span>
            ))}
          </span>
        )}
      </span>

      <span className="mt-4 flex items-start justify-between gap-3">
        <span className="min-w-0">
          <span className="flex items-center gap-2 font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-mute">
            <span>{String(index + 1).padStart(2, '0')}</span>
            {product.brand && (
              <span className="hidden min-w-0 items-center gap-2 sm:flex">
                <span aria-hidden className="h-px w-3 shrink-0 bg-samara-mute/50" />
                <span className="truncate uppercase">{product.brand}</span>
              </span>
            )}
          </span>
          <span className="mt-1.5 line-clamp-2 block font-serif text-[1.0625rem] font-normal capitalize leading-snug text-samara-ivory transition-colors duration-300 group-hover:text-samara-gold sm:text-[1.1875rem]">
            {product.name}
          </span>
          <span className="mt-2 block">
            {!price ? (
              <span aria-hidden className="block h-4 w-16 bg-samara-forest-2" />
            ) : (
              <span className="flex flex-wrap items-baseline gap-x-2 font-sans text-[0.8125rem] tabular-nums">
                <span className="text-samara-ivory">{formatPriceSync(price.price, price.currency)}</span>
                {showMrp && (
                  <s className="text-[0.75rem] text-samara-mute">
                    <span className="sr-only">MRP </span>
                    {formatPriceSync(price.mrp as number, price.currency)}
                  </s>
                )}
              </span>
            )}
          </span>
        </span>

        <span
          aria-hidden
          className="mt-1 hidden h-11 w-11 shrink-0 items-center justify-center rounded-full border border-samara-ivory/[0.45] text-samara-ivory transition-colors duration-300 group-hover:border-samara-gold group-hover:bg-samara-gold group-hover:text-samara-cream-ink sm:flex"
        >
          <ArrowUpRight className="h-4 w-4" strokeWidth={1.25} />
        </span>
      </span>
    </Link>
  );
}
