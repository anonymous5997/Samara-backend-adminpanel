'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WishlistCardProps {
  index: number;
  name: string;
  href: string;
  imageUrl?: string | null;
  /** Already-formatted price string from useWishlist().formatPrice. */
  price: string;
  onAddToBag: () => void;
  onRemove: () => void;
}

/**
 * Wishlist tile in the HomeProductCard family (light tone): 4:5 image,
 * index number, serif name, price, circular add-to-bag button. Purely
 * presentational — the actions are passed in unchanged.
 */
export function WishlistCard({ index, name, href, imageUrl, price, onAddToBag, onRemove }: WishlistCardProps) {
  return (
    <article className="group relative">
      <div className="relative">
        <Link href={href} tabIndex={-1} aria-hidden data-img-reveal="" className="sm-zoom relative block aspect-[4/5] w-full bg-samara-cream-2">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={name}
              fill
              sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-light text-samara-cream-mute">
              {name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </Link>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name} from wishlist`}
          className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full bg-samara-cream/90 text-samara-cream-ink transition-colors duration-300 hover:bg-samara-cream-ink hover:text-samara-cream focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-cream-ink"
        >
          <X aria-hidden className="h-4 w-4" strokeWidth={1.25} />
        </button>
      </div>

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-cream-mute">
            {String(index + 1).padStart(2, '0')}
          </p>
          <h3 className="mt-1.5 font-serif text-[1.0625rem] font-normal leading-snug sm:text-[1.1875rem]">
            <Link
              href={href}
              className="line-clamp-2 text-samara-cream-ink transition-colors duration-300 hover:text-samara-gold-deep focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-cream-ink"
            >
              {name}
            </Link>
          </h3>
          <p className="mt-2 font-sans text-[0.8125rem] tabular-nums text-samara-cream-ink">{price}</p>
        </div>

        <button
          type="button"
          onClick={onAddToBag}
          aria-label={`Add ${name} to bag`}
          className={cn(
            'mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2',
            'border-samara-gold-deep/60 text-samara-gold-deep hover:border-samara-cream-ink hover:bg-samara-cream-ink hover:text-samara-cream focus-visible:outline-samara-cream-ink',
          )}
        >
          <ShoppingBag aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        </button>
      </div>
    </article>
  );
}
