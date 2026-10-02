'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Drawer } from '@/components/shell/Drawer';
import { CartLine, CartLineSkeleton } from '@/components/shell/cart/CartLine';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPriceSync } from '@/lib/currency-utils';

export interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const { user } = useAuth();
  const { items, loading, currency, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const [pending, setPending] = useState<Record<string, boolean>>({});

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const run = useCallback(async (id: string, action: () => Promise<void>) => {
    setPending((p) => ({ ...p, [id]: true }));
    try {
      await action();
    } finally {
      setPending((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }, []);

  // Same derivations as app/cart/page.tsx (summary currency + subtotal).
  const cartCurrency = items[0]?.currency ?? currency;
  const subtotal = getCartTotal();
  const count = items.length;

  // Skeleton only on the initial load; later refetches keep the current lines.
  const showSkeleton = loading && count === 0;
  const isEmpty = !loading && count === 0;

  // Same destination and auth guard as the /cart checkout button (no coupon here).
  const checkoutHref = user ? '/checkout' : '/auth/login?redirect=/checkout';

  const footer =
    count > 0 ? (
      <div>
        <div className="flex items-baseline justify-between">
          <span className="sm-eyebrow text-samara-ivory">Subtotal</span>
          <span className="font-sans text-lg tabular-nums text-samara-ivory">
            {formatPriceSync(subtotal, cartCurrency)}
          </span>
        </div>
        <p className="mt-2 font-sans text-xs leading-relaxed text-samara-mute">
          Inclusive of all taxes. Shipping calculated at checkout.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link href={checkoutHref} onClick={close} className="sm-btn sm-btn-solid w-full">
            {user ? 'Checkout' : 'Sign in to checkout'}
            <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
          </Link>
          <Link href="/cart" onClick={close} className="sm-btn sm-btn-ghost w-full">
            View bag
          </Link>
        </div>
      </div>
    ) : undefined;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title="Your Bag"
      meta={count > 0 ? `${count} ${count === 1 ? 'Item' : 'Items'}` : undefined}
      footer={footer}
      className="md:max-w-[480px]"
    >
      {showSkeleton && (
        <ul aria-label="Loading bag">
          {[0, 1, 2].map((i) => (
            <CartLineSkeleton key={i} />
          ))}
        </ul>
      )}

      {isEmpty && (
        <div className="flex min-h-full flex-col justify-center py-16">
          <p
            className="sm-stagger font-serif text-[2.75rem] font-light leading-[1.02] text-samara-ivory"
            style={{ ['--i' as string]: 1 }}
          >
            Your bag is <span className="sm-accent">empty.</span>
          </p>
          <p className="sm-body sm-stagger mt-5 max-w-[30ch]" style={{ ['--i' as string]: 2 }}>
            Pieces you add will wait for you here.
          </p>
          <div
            className="sm-stagger mt-10 flex flex-wrap items-center gap-x-8 gap-y-5"
            style={{ ['--i' as string]: 3 }}
          >
            <Link href="/sarees" onClick={close} className="sm-btn sm-btn-solid">
              Shop sarees
            </Link>
            <Link
              href="/collections"
              onClick={close}
              className="sm-link font-sans text-xs font-medium uppercase tracking-[0.22em] text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-gold"
            >
              Explore collections
            </Link>
          </div>
        </div>
      )}

      {count > 0 && (
        <ul aria-label="Items in your bag">
          {items.map((item, index) => (
            <CartLine
              key={item.id}
              item={item}
              index={index}
              pending={!!pending[item.id]}
              onQuantity={(q) => run(item.id, () => updateQuantity(item.id, q))}
              onRemove={() => run(item.id, () => removeFromCart(item.id))}
              onNavigate={close}
            />
          ))}
        </ul>
      )}
    </Drawer>
  );
}
