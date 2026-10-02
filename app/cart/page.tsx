'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPriceSync } from '@/lib/currency-utils';
import { Minus, Plus, ArrowRight, ShieldCheck, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Coupon } from '@/lib/types';
import { toast } from 'sonner';
import { trackAnalyticsEvent } from '@/lib/analytics.client';
import { cn } from '@/lib/utils';
import { AccountHero, BTN_GOLD, BTN_INK, Eyebrow, FIELD_LIGHT, FOCUS, TEXT_LINK } from '@/components/account/ui';


export default function CartPage() {
  const { user } = useAuth();

  const {
    items,
    currency,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);
  
  // ✅ 1. HYDRATION STATE
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  /* -------------------------------------------------------------------------- */
  /* CALCULATION LOGIC                                                          */
  /* -------------------------------------------------------------------------- */

  // Determine the display currency for the summary (fallback to global if empty)
  const cartCurrency = items[0]?.currency ?? currency;

  // 1. SUBTOTAL
  const subtotal = items.reduce(
    (sum, item) => sum + (item.unit_price * item.quantity),
    0
  );

  // 2. COUPON LOGIC
  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    let discount = 0;

    // Percentage coupon
    if (appliedCoupon.type === 'PERCENTAGE') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } 
    // Flat coupon
    else {
      discount = appliedCoupon.value;
    }

    // Cap discount using INR cap as absolute value
    if (appliedCoupon.max_discount_inr) {
      discount = Math.min(discount, appliedCoupon.max_discount_inr);
    }

    // Never exceed subtotal
    return Math.min(discount, subtotal);
  };

  const discount = calculateDiscount();
  
  // 3. FINAL TOTAL
  const total = subtotal - discount;

  /* -------------------------------------------------------------------------- */
  /* HANDLERS                                                                   */
  /* -------------------------------------------------------------------------- */

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;

    setLoading(true);

    try {
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !coupon) {
        toast.error('Invalid coupon code');
        setAppliedCoupon(null);
        return;
      }

      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

      if (now < validFrom || (validTo && now > validTo)) {
        toast.error('Coupon is expired');
        setAppliedCoupon(null);
        return;
      }

      // Check Minimum Order Value
      if (subtotal < coupon.min_cart_value_inr) {
        toast.error(`Minimum cart value of ${formatPriceSync(coupon.min_cart_value_inr, cartCurrency)} required`);
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.info('Coupon removed');
  };

  /* -------------------------------------------------------------------------- */
  /* RENDER: HYDRATION & EMPTY STATES                                           */
  /* -------------------------------------------------------------------------- */

  // ✅ 2. HYDRATION GUARD
  if (!hydrated) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink">
         <div className="sm-eyebrow animate-pulse motion-reduce:animate-none">Loading bag...</div>
      </div>
    );
  }

  // ✅ 3. SAFE EMPTY CHECK
  if (items.length === 0) {
    return (
      <div className="bg-samara-ink">
        <div className="sm-container grid min-h-[72vh] items-center py-20 md:py-28">
          <div className="max-w-2xl">
            <Eyebrow className="sm-anim-fade-up">Shopping Bag</Eyebrow>
            <h1 className="sm-display-l sm-anim-fade-up mt-6 font-light [--anim-delay:80ms]">
              Your cart is <span className="sm-accent">empty</span>
            </h1>
            <p className="sm-body sm-anim-fade-up mt-6 max-w-[40ch] [--anim-delay:160ms]">
              Looks like you haven&apos;t added anything to your bag yet.
            </p>
            <div className="sm-anim-fade-up mt-10 flex flex-wrap items-center gap-x-10 gap-y-6 [--anim-delay:240ms]">
              <Link href="/sarees" className={cn(BTN_GOLD, 'w-full sm:w-auto')}>
                Start Shopping
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
              </Link>
              <Link href="/collections" className={cn(TEXT_LINK, FOCUS, 'text-samara-ivory hover:text-samara-gold')}>
                Explore collections
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* RENDER: MAIN CART                                                          */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      <div className="bg-samara-ink pb-32 text-samara-ivory lg:pb-0">
        <AccountHero
          eyebrow={<>{items.length} {items.length === 1 ? 'Item' : 'Items'}</>}
          title={<>Shopping <span className="sm-accent">Bag</span></>}
          aside={
            <Link href="/sarees" className={cn(TEXT_LINK, FOCUS, 'hidden text-samara-mute hover:text-samara-ivory md:inline-block')}>
              Continue Shopping
            </Link>
          }
        />

        <div className="sm-container grid grid-cols-1 gap-12 pb-16 pt-4 md:pb-24 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:pt-8 xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-24">

            {/* LEFT SIDE: PRODUCT LIST */}
            <div className="min-w-0">
              <div className="hidden grid-cols-[minmax(0,1fr)_140px_120px] border-b border-samara-line pb-4 pt-6 md:grid">
                <span className="sm-eyebrow">Piece</span>
                <span className="sm-eyebrow text-center">Quantity</span>
                <span className="sm-eyebrow text-right">Total</span>
              </div>
              <ul aria-label="Items in your bag">
              {items.map((item, index) => (
                <li
                  key={item.id}
                  className="sm-stagger grid grid-cols-[96px_minmax(0,1fr)] gap-x-5 border-b border-samara-line py-7 sm:grid-cols-[120px_minmax(0,1fr)] sm:gap-x-7 md:grid-cols-[132px_minmax(0,1fr)_140px_120px] md:items-start md:py-9"
                  style={{ ['--i' as string]: index }}
                >
                  {/* IMAGE */}
                  <Link
                    href={`/products/${item.product.slug}`}
                    tabIndex={-1}
                    aria-hidden="true"
                    className="sm-zoom group relative block aspect-[3/4] w-full bg-samara-char md:row-span-1"
                  >
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product.name}
                        fill
                        sizes="(min-width: 768px) 132px, 120px"
                        className="object-cover"
                      />
                    ) : (
                      <span className="sm-eyebrow absolute inset-0 flex items-center justify-center text-center text-[0.5625rem]">
                        No Image
                      </span>
                    )}
                  </Link>

                  {/* DETAILS */}
                  <div className="flex min-w-0 flex-col md:pr-6">
                    <p className="font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-mute">
                      {String(index + 1).padStart(2, '0')}
                    </p>
                    <Link
                      href={`/products/${item.product.slug}`}
                      className={cn('mt-1.5 line-clamp-2 font-serif text-[1.25rem] font-normal leading-snug text-samara-ivory transition-colors duration-300 hover:text-samara-gold sm:text-[1.4375rem]', FOCUS)}
                    >
                      {item.product.name}
                    </Link>

                    {/* Variant Info */}
                    {(item.variant?.size || item.variant?.color) && (
                      <p className="mt-2 flex flex-wrap gap-x-4 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute">
                        {item.variant.size && <span>Size: {item.variant.size}</span>}
                        {item.variant.color && <span>Color: {item.variant.color}</span>}
                      </p>
                    )}

                    {/* Price per unit */}
                    <p className="mt-2 font-sans text-xs tabular-nums text-samara-mute">
                      {formatPriceSync(item.unit_price, item.currency)} / unit
                    </p>

                    {/* Mobile: quantity + total + remove */}
                    <div className="mt-auto flex items-center justify-between gap-3 pt-4 md:hidden">
                      <div className="-ml-3 flex items-center" role="group" aria-label={`Quantity for ${item.product.name}`}>
                        <button
                          type="button"
                          className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                          aria-label={`Decrease quantity of ${item.product.name}`}
                        >
                          <Minus className="h-3.5 w-3.5" strokeWidth={1.25} />
                        </button>
                        <span className="w-6 text-center font-sans text-sm tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory', FOCUS)}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          aria-label={`Increase quantity of ${item.product.name}`}
                        >
                          <Plus className="h-3.5 w-3.5" strokeWidth={1.25} />
                        </button>
                      </div>
                      <p className="font-sans text-[0.9375rem] tabular-nums text-samara-ivory">
                        {formatPriceSync(item.unit_price * item.quantity, item.currency)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.id)}
                      aria-label={`Remove ${item.product.name} from bag`}
                      className={cn('-ml-1 mt-1 flex min-h-[44px] w-fit items-center px-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute transition-colors hover:text-samara-ivory md:mt-6', FOCUS)}
                    >
                      <span className="sm-link">Remove</span>
                    </button>
                  </div>

                  {/* Desktop: quantity */}
                  <div className="hidden justify-center md:flex">
                    <div className="flex items-center border border-samara-ivory/20" role="group" aria-label={`Quantity for ${item.product.name}`}>
                      <button
                        type="button"
                        className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory disabled:pointer-events-none disabled:opacity-30', FOCUS)}
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                      >
                        <Minus className="h-3.5 w-3.5" strokeWidth={1.25} />
                      </button>
                      <span className="w-6 text-center font-sans text-sm tabular-nums">{item.quantity}</span>
                      <button
                        type="button"
                        className={cn('flex h-11 w-11 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory', FOCUS)}
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        aria-label={`Increase quantity of ${item.product.name}`}
                      >
                        <Plus className="h-3.5 w-3.5" strokeWidth={1.25} />
                      </button>
                    </div>
                  </div>

                  {/* Desktop: row total */}
                  <p className="hidden pt-3 text-right font-sans text-[0.9375rem] tabular-nums text-samara-ivory md:block">
                    {formatPriceSync(item.unit_price * item.quantity, item.currency)}
                  </p>
                </li>
              ))}
              </ul>

              <p className="mt-8 flex items-center gap-3 font-sans text-xs text-samara-mute">
                <ShieldCheck className="h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                Safe and secure checkout. 100% Authentic products.
              </p>
            </div>

            {/* RIGHT SIDE: ORDER SUMMARY */}
            <aside className="h-fit lg:sticky lg:top-[calc(var(--sm-header-h)+2rem)]" aria-labelledby="cart-summary-title">
                <div className="bg-samara-cream px-6 py-8 text-samara-cream-ink sm:px-9 sm:py-10">
                <h2 id="cart-summary-title" className="font-serif text-[1.875rem] font-light leading-tight text-samara-cream-ink">
                    Order <span className="font-light italic text-samara-gold-deep">Summary</span>
                </h2>

                <dl className="mt-8 space-y-4 border-t border-samara-cream-ink/15 pt-6 font-sans text-sm">
                {/* Subtotal */}
                <div className="flex justify-between gap-4">
                    <dt className="text-samara-cream-mute">Subtotal</dt>
                    <dd className="tabular-nums">
                        {formatPriceSync(subtotal, cartCurrency)}
                    </dd>
                </div>

                {/* Shipping */}
                <div className="flex justify-between gap-4">
                    <dt className="text-samara-cream-mute">Shipping</dt>
                    <dd className="text-right">Calculated at Checkout</dd>
                </div>

                {/* Discount */}
                {appliedCoupon && (
                    <div className="flex justify-between gap-4 text-samara-gold-deep">
                        <dt>Coupon ({appliedCoupon.code})</dt>
                        <dd className="tabular-nums">-{formatPriceSync(discount, cartCurrency)}</dd>
                    </div>
                )}
                </dl>

                {/* COUPON INPUT */}
                <div className="mt-8">
                    {appliedCoupon ? (
                        <div className="flex min-h-[48px] items-center justify-between gap-4 border border-samara-gold-deep/40 px-4">
                            <span className="font-sans text-xs uppercase tracking-[0.18em]">Code <b className="font-semibold">{appliedCoupon.code}</b> applied</span>
                            <button onClick={handleRemoveCoupon} className="flex min-h-[44px] items-center font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-cream-mute transition-colors hover:text-samara-cream-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-cream-ink">
                                <span className="sm-link">Remove</span>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <label htmlFor="cart-coupon" className="mb-2.5 block font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-cream-mute">
                              Coupon code
                            </label>
                            <div className="flex">
                            <Input
                            id="cart-coupon"
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className={cn(FIELD_LIGHT, 'border-r-0')}
                            />
                            <button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={loading || !couponCode}
                            className="flex h-12 min-w-[96px] shrink-0 items-center justify-center border border-samara-cream-ink bg-samara-cream-ink px-5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-samara-cream transition-colors hover:bg-samara-gold-deep hover:border-samara-gold-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-cream-ink"
                            >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* TOTAL */}
                <div className="mt-8 flex items-end justify-between gap-4 border-t border-samara-cream-ink/15 pt-6">
                    <span className="sm-eyebrow text-samara-cream-ink">Total Amount</span>
                    <div className="text-right">
                        <span className="font-serif text-[2rem] font-normal leading-none tabular-nums">
                            {formatPriceSync(total, cartCurrency)}
                        </span>
                        <p className="mt-2 font-sans text-[0.6875rem] text-samara-cream-mute">
                            (Inclusive of all taxes)
                        </p>
                    </div>
                </div>

                {/* CHECKOUT BUTTON */}
                    <Link
                    href={user 
                        ? `/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`
                        : `/auth/login?redirect=/checkout${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ''}`
                    }
                    className={cn(BTN_INK, 'mt-8 hidden w-full lg:flex')}
                    >
                        {user ? (
                            <>Checkout <ArrowRight className="h-4 w-4" strokeWidth={1.25} /></>
                        ) : (
                            <>Sign in to Checkout <User className="h-4 w-4" strokeWidth={1.25} /></>
                        )}
                    </Link>

                <div className="mt-6 text-center">
                    <Link href="/sarees" className={cn(TEXT_LINK, 'text-samara-cream-mute hover:text-samara-cream-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-samara-cream-ink')}>
                        Continue Shopping
                    </Link>
                </div>
                </div>
            </aside>
        </div>
      </div>

      {/* MOBILE / TABLET CHECKOUT BAR */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-samara-line bg-samara-ink/95 backdrop-blur-sm lg:hidden">
        <div className="sm-container flex items-center gap-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="min-w-0">
            <p className="sm-eyebrow text-[0.5625rem]">Total</p>
            <p className="mt-1 font-sans text-base tabular-nums text-samara-ivory">{formatPriceSync(total, cartCurrency)}</p>
          </div>
          <Link
            href={user 
                ? `/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`
                : `/auth/login?redirect=/checkout${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ''}`
            }
            className={cn(BTN_GOLD, 'ml-auto min-h-[3rem] flex-1 px-4 sm:max-w-[320px]')}
          >
            {user ? (
                <>Checkout <ArrowRight className="h-4 w-4" strokeWidth={1.25} /></>
            ) : (
                <>Sign in to Checkout <User className="h-4 w-4" strokeWidth={1.25} /></>
            )}
          </Link>
        </div>
      </div>
    </>
  );
}