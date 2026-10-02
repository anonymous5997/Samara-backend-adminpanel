'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { Drawer } from '@/components/shell/Drawer';
import { useAuth } from '@/lib/auth-context';
import { useWishlist } from '@/hooks/useWishlist';

export interface WishlistDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const actionClass =
  'inline-flex min-h-[44px] items-center font-sans text-[11px] font-medium uppercase tracking-eyebrow transition-colors duration-300 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-gold disabled:opacity-40';

/**
 * Slide-in wishlist. Data and actions come from useWishlist (the same
 * queries the /wishlist page uses); it fetches each time the drawer opens.
 */
export function WishlistDrawer({ open, onOpenChange }: WishlistDrawerProps) {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, removeFromWishlist, handleAddToCart, formatPrice } =
    useWishlist({ enabled: open });
  const [pending, setPending] = useState<string | null>(null);
  const pathname = usePathname();
  const lastPath = useRef(pathname);

  // Close on navigation (covers back/forward as well as in-drawer links).
  useEffect(() => {
    if (lastPath.current === pathname) return;
    lastPath.current = pathname;
    if (open) onOpenChange(false);
  }, [pathname, open, onOpenChange]);

  const close = () => onOpenChange(false);

  const run = async (key: string, action: () => Promise<void>) => {
    setPending(key);
    try {
      await action();
    } finally {
      setPending(null);
    }
  };

  const showSkeleton = authLoading || (!!user && loading);
  const count = user && !loading ? items.length : null;

  let body: React.ReactNode;
  if (showSkeleton) {
    body = <WishlistSkeleton />;
  } else if (!user) {
    body = (
      <div className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center py-14">
        <p className="sm-stagger sm-eyebrow" style={{ ['--i' as string]: 0 }}>
          Your wishlist
        </p>
        <p
          className="sm-stagger mt-5 font-serif text-3xl font-light leading-tight text-samara-ivory"
          style={{ ['--i' as string]: 1 }}
        >
          Keep the pieces you <span className="sm-accent">love</span> close.
        </p>
        <p className="sm-stagger sm-body mt-4 text-sm" style={{ ['--i' as string]: 2 }}>
          Sign in to save pieces and return to them on any device.
        </p>
        <div className="sm-stagger mt-10" style={{ ['--i' as string]: 3 }}>
          <Link href="/auth/login" onClick={close} className="sm-btn sm-btn-solid">
            Sign in
          </Link>
        </div>
      </div>
    );
  } else if (items.length === 0) {
    body = (
      <div className="flex min-h-[calc(100dvh-14rem)] flex-col justify-center py-14">
        <p className="sm-stagger sm-eyebrow" style={{ ['--i' as string]: 0 }}>
          Nothing saved yet
        </p>
        <p
          className="sm-stagger mt-5 font-serif text-3xl font-light leading-tight text-samara-ivory"
          style={{ ['--i' as string]: 1 }}
        >
          A wishlist begins with a <span className="sm-accent">single</span> weave.
        </p>
        <p className="sm-stagger sm-body mt-4 text-sm" style={{ ['--i' as string]: 2 }}>
          Tap the heart on any piece to keep it here.
        </p>
        <div className="sm-stagger mt-10" style={{ ['--i' as string]: 3 }}>
          <Link href="/sarees" onClick={close} className="sm-btn sm-btn-ghost">
            Explore sarees
          </Link>
        </div>
      </div>
    );
  } else {
    body = (
      <ul className="divide-y divide-samara-line">
        {items.map(({ product, image }, index) => {
          const href = `/products/${product.slug}`;
          return (
            <li
              key={product.id}
              className="sm-stagger grid grid-cols-[88px_1fr] gap-5 py-6"
              style={{ ['--i' as string]: index }}
            >
              <Link
                href={href}
                onClick={close}
                className="sm-zoom relative block aspect-[3/4] overflow-hidden bg-samara-char focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                aria-label={product.name}
              >
                {image ? (
                  <Image
                    src={image.image_url}
                    alt={product.name}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                ) : (
                  <span className="flex h-full items-center justify-center font-serif text-xl text-samara-mute">
                    S
                  </span>
                )}
              </Link>

              <div className="flex min-w-0 flex-col">
                <Link
                  href={href}
                  onClick={close}
                  className="font-serif text-lg font-normal leading-snug text-samara-ivory transition-colors duration-300 hover:text-samara-gold focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
                >
                  <span className="line-clamp-2">{product.name}</span>
                </Link>
                <p className="mt-2 font-sans text-sm tabular-nums text-samara-mute">
                  {formatPrice(product)}
                </p>

                <div className="mt-auto flex items-center gap-6 pt-4">
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() => run(`add:${product.id}`, () => handleAddToCart(product.id))}
                    className={`${actionClass} text-samara-ivory hover:text-samara-gold`}
                  >
                    <span className="sm-link">
                      {pending === `add:${product.id}` ? 'Adding…' : 'Add to bag'}
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={pending !== null}
                    onClick={() =>
                      run(`remove:${product.id}`, () => removeFromWishlist(product.id))
                    }
                    className={`${actionClass} text-samara-mute hover:text-samara-ivory`}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <span className="sm-link">
                      {pending === `remove:${product.id}` ? 'Removing…' : 'Remove'}
                    </span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <>
      <Drawer
        open={open}
        onOpenChange={onOpenChange}
        side="right"
        title="Wishlist"
        meta={count !== null ? String(count).padStart(2, '0') : undefined}
        // The full page only helps once signed in with something saved.
        footer={
          user && (loading || items.length > 0) ? (
            <Link href="/wishlist" onClick={close} className="sm-btn sm-btn-ghost w-full">
              View wishlist
            </Link>
          ) : undefined
        }
      >
        {body}
      </Drawer>
    </>
  );
}

function WishlistSkeleton() {
  return (
    <ul aria-busy="true" aria-label="Loading wishlist" className="divide-y divide-samara-line">
      {[0, 1, 2].map((i) => (
        <li key={i} className="grid grid-cols-[88px_1fr] gap-5 py-6">
          <div className="aspect-[3/4] animate-pulse bg-samara-char" />
          <div className="flex flex-col gap-3 pt-1">
            <div className="h-4 w-3/4 animate-pulse bg-samara-char" />
            <div className="h-3 w-1/3 animate-pulse bg-samara-char" />
            <div className="mt-6 h-3 w-1/2 animate-pulse bg-samara-char" />
          </div>
        </li>
      ))}
    </ul>
  );
}
