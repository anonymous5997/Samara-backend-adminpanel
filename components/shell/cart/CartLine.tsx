'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import type { CartItem } from '@/lib/cart-context';
import { formatPriceSync } from '@/lib/currency-utils';
import { cn } from '@/lib/utils';

interface CartLineProps {
  item: CartItem;
  index: number;
  pending: boolean;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
  onNavigate: () => void;
}

/**
 * One bag line. Name, image, variant label, unit price and line total are
 * derived exactly as in app/cart/page.tsx so the drawer and /cart agree.
 */
export function CartLine({ item, index, pending, onQuantity, onRemove, onNavigate }: CartLineProps) {
  const name: string = item.product?.name ?? '';
  const slug: string | undefined = item.product?.slug;
  const href = slug ? `/products/${slug}` : undefined;

  const meta: string[] = [];
  if (item.variant?.size) meta.push(`Size: ${item.variant.size}`);
  if (item.variant?.color) meta.push(`Color: ${item.variant.color}`);

  const image = (
    <div className="relative aspect-[3/4] w-[88px] shrink-0 overflow-hidden bg-samara-char md:w-24">
      {item.image_url ? (
        <Image src={item.image_url} alt={name} fill sizes="96px" className="object-cover" />
      ) : (
        <span className="sm-eyebrow absolute inset-0 flex items-center justify-center text-center text-[0.5625rem]">
          No image
        </span>
      )}
    </div>
  );

  const focus = 'focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold';

  return (
    <li
      className={cn(
        'sm-stagger flex gap-5 border-b border-samara-line py-6 transition-opacity duration-300 ease-editorial last:border-b-0',
        pending && 'opacity-60',
      )}
      style={{ ['--i' as string]: index }}
      aria-busy={pending || undefined}
    >
      {href ? (
        <Link href={href} onClick={onNavigate} tabIndex={-1} aria-hidden="true" className="block">
          {image}
        </Link>
      ) : (
        image
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {href ? (
              <Link
                href={href}
                onClick={onNavigate}
                className={cn('font-serif text-lg font-normal leading-snug text-samara-ivory transition-colors hover:text-samara-gold', focus)}
              >
                {name}
              </Link>
            ) : (
              <p className="font-serif text-lg font-normal leading-snug text-samara-ivory">{name}</p>
            )}
            {meta.length > 0 && (
              <p className="mt-1.5 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute">
                {meta.join(' · ')}
              </p>
            )}
          </div>
          <p className="shrink-0 font-sans text-sm tabular-nums text-samara-ivory">
            {formatPriceSync(item.unit_price * item.quantity, item.currency)}
          </p>
        </div>

        {item.quantity > 1 && (
          <p className="mt-1 font-sans text-xs tabular-nums text-samara-mute">
            {formatPriceSync(item.unit_price, item.currency)} / unit
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-4">
          <div className="-ml-3 flex items-center" role="group" aria-label={`Quantity for ${name}`}>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity - 1)}
              disabled={pending || item.quantity <= 1}
              aria-label={`Decrease quantity of ${name}`}
              className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory disabled:pointer-events-none disabled:opacity-30', focus)}
            >
              <Minus className="h-3.5 w-3.5" strokeWidth={1.25} />
            </button>
            <span className="w-6 text-center font-sans text-sm tabular-nums text-samara-ivory" aria-live="polite">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => onQuantity(item.quantity + 1)}
              disabled={pending}
              aria-label={`Increase quantity of ${name}`}
              className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory disabled:pointer-events-none disabled:opacity-30', focus)}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={1.25} />
            </button>
          </div>

          <button
            type="button"
            onClick={onRemove}
            disabled={pending}
            aria-label={`Remove ${name} from bag`}
            className={cn('-mr-1 flex min-h-[44px] items-center px-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute transition-colors hover:text-samara-ivory disabled:pointer-events-none disabled:opacity-40', focus)}
          >
            <span className="sm-link">Remove</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartLineSkeleton() {
  return (
    <li className="flex gap-5 border-b border-samara-line py-6 last:border-b-0" aria-hidden="true">
      <div className="aspect-[3/4] w-[88px] shrink-0 bg-white/[0.05] md:w-24" />
      <div className="flex flex-1 flex-col gap-3 pt-1">
        <div className="h-4 w-3/4 bg-white/[0.05]" />
        <div className="h-2.5 w-1/3 bg-white/[0.05]" />
        <div className="mt-auto h-3 w-1/4 bg-white/[0.05]" />
      </div>
    </li>
  );
}
