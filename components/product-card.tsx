'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Product, ProductImage } from '@/lib/types';
import { formatPriceSync } from '@/lib/currency-utils';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import { ResolvedPrice } from '@/lib/resolve-product-price';
import { cn } from '@/lib/utils';

/** Any image row that at least carries a URL (full ProductImage rows still fit). */
export type ProductCardImage = Pick<ProductImage, 'image_url'> & Partial<ProductImage>;

interface ProductCardProps {
  product: Product;
  image?: ProductCardImage | null;
  price?: ResolvedPrice;
  /** Optional second photo, crossfaded in on desktop hover. Defaults to the product's next image when its rows are present. */
  hoverImage?: ProductCardImage | null;
  /** next/image `sizes` hint for the grid this card sits in. */
  sizes?: string;
  /** Eager-load the image (first row above the fold). */
  priority?: boolean;
}

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

/** The product's own image rows, when the query that produced it joined them. */
function imageRows(product: Product): Array<{ image_url?: string | null }> {
  const p = product as Product & {
    product_images?: Array<{ image_url?: string | null }> | null;
    images?: Array<{ image_url?: string | null }> | null;
  };
  return p.product_images ?? p.images ?? [];
}

const DEFAULT_SIZES = '(min-width: 1440px) 22vw, (min-width: 1024px) 30vw, 46vw';

export function ProductCard({ product, image, price, hoverImage, sizes = DEFAULT_SIZES, priority = false }: ProductCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initial wishlisted state for this (user, product). Read only.
  useEffect(() => {
    if (!user) return;
    let alive = true;
    supabase
      .from('wishlist_items')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .limit(1)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading wishlist state:', error);
          return;
        }
        if (alive) setIsWishlisted((data?.length ?? 0) > 0);
      });
    return () => {
      alive = false;
    };
  }, [user, product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsWishlisted(false);
      } else {
        await supabase.from('wishlist_items').insert({
          user_id: user.id,
          product_id: product.id,
        });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  const href = `/products/${product.slug}`;
  const primaryUrl = image?.image_url;
  const primary = usable(primaryUrl) ? primaryUrl : null;
  let secondary: string | null = null;
  if (primary && hoverImage !== undefined) {
    const hoverUrl = hoverImage?.image_url;
    secondary = usable(hoverUrl) && hoverUrl !== primary ? hoverUrl : null;
  } else if (primary) {
    secondary =
      imageRows(product)
        .map((row) => row.image_url)
        .find((url): url is string => usable(url) && url !== primary) ?? null;
  }
  const showMrp = !!price && typeof price.mrp === 'number' && price.mrp > price.displayPrice;

  return (
    <article className="group relative">
      {/* IMAGE */}
      <div className="relative">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="sm-zoom relative block aspect-[4/5] w-full bg-samara-char"
        >
          {primary ? (
            <>
              <Image
                src={primary}
                alt={product.name}
                fill
                sizes={sizes}
                priority={priority}
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
            <span className="absolute inset-0 flex items-center justify-center font-serif text-6xl font-light text-samara-mute/50">
              {product.name.trim().charAt(0).toUpperCase()}
            </span>
          )}
        </Link>

        {/* Wishlist */}
        {user && (
          <button
            type="button"
            onClick={toggleWishlist}
            disabled={loading}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
            className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center text-samara-ivory transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:-outline-offset-4 focus-visible:outline-samara-gold disabled:cursor-wait"
          >
            <Heart
              aria-hidden
              strokeWidth={1.25}
              className={cn(
                'h-[18px] w-[18px] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)] transition-[fill,color] duration-300',
                isWishlisted ? 'fill-samara-gold text-samara-gold' : 'fill-transparent',
              )}
            />
          </button>
        )}
      </div>

      {/* DETAILS */}
      <div className="mt-4">
        <p className="font-sans text-[0.625rem] uppercase tracking-[0.22em] text-samara-mute">
          {product.brand || 'Samara Heritage'}
        </p>

        <h3 className="mt-1.5 font-serif text-[1.125rem] font-normal leading-snug md:text-[1.1875rem]">
          <Link
            href={href}
            className="line-clamp-2 text-samara-ivory transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold"
          >
            {product.name}
          </Link>
        </h3>

        <div className="mt-2 min-h-[1.25rem]">
          {!price ? (
            <span aria-hidden className="block h-4 w-16 bg-samara-forest-2" />
          ) : (
            <p className="flex flex-wrap items-baseline gap-x-2 font-sans text-[0.8125rem] tabular-nums">
              <span className="text-samara-ivory">
                {formatPriceSync(price.displayPrice, price.currency)}
              </span>
              {showMrp && (
                <s className="text-[0.75rem] text-samara-mute">
                  <span className="sr-only">MRP </span>
                  {formatPriceSync(price.mrp as number, price.currency)}
                </s>
              )}
            </p>
          )}
        </div>
      </div>
    </article>
  );
}
