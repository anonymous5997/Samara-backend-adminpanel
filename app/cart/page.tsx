'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPriceSync } from '@/lib/currency-utils';
import { Minus, Plus, Trash2, ShoppingBag, ArrowRight, ShieldCheck, User, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Coupon } from '@/lib/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { trackAnalyticsEvent } from '@/lib/analytics.client';


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
      <div className="bg-samara-void min-h-screen flex items-center justify-center">
         <div className="animate-pulse text-samara-ivory/40 font-sans tracking-widest uppercase text-sm">Loading bag...</div>
      </div>
    );
  }

  // ✅ 3. SAFE EMPTY CHECK
  if (items.length === 0) {
    return (
      <div className="bg-samara-void text-samara-ivory min-h-screen flex items-center justify-center px-4 pt-32 pb-24">
        <Toaster />
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-samara-void1 rounded-full flex items-center justify-center mx-auto mb-8 border border-samara-ivory/10">
            <ShoppingBag className="h-8 w-8 text-samara-ivory/40 stroke-[1.5]" />
          </div>
          <h1 className="text-4xl font-serif mb-4 text-samara-ivory">Your bag is empty</h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60 mb-10">
            Looks like you haven't added anything to your bag yet.
          </p>
          <Button 
            asChild 
            className="w-full sm:w-auto px-10 h-14 rounded-none bg-samara-gold hover:bg-samara-goldDeep text-samara-void transition-colors font-sans text-[11px] tracking-[0.2em] uppercase"
          >
            <Link href="/sarees">Start Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* RENDER: MAIN CART                                                          */
  /* -------------------------------------------------------------------------- */
  return (
    <>
      <Toaster />

      <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          <div className="flex items-end justify-between mb-12 border-b border-samara-ivory/10 pb-6">
            <div>
              <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
                Your Selection
              </span>
              <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory">
                Shopping <em className="italic text-samara-gold">Bag</em> <span className="text-samara-ivory/40 text-2xl font-serif ml-2">({items.length})</span>
              </h1>
            </div>
            <Link href="/sarees" className="hidden md:block text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors border-b border-transparent hover:border-samara-gold pb-1">
              Continue Shopping
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* LEFT SIDE: PRODUCT LIST */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-row gap-4 p-4 sm:p-6 border border-samara-ivory/10 bg-samara-void1 hover:border-samara-gold/30 transition-colors group"
                >
                  {/* IMAGE */}
                  <div className="relative w-24 h-32 sm:w-32 sm:h-40 overflow-hidden bg-samara-void flex-shrink-0">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-samara-ivory/40 text-[10px] font-sans uppercase tracking-widest">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                          <Link
                              href={`/products/${item.product.slug}`}
                              className="font-serif text-lg sm:text-xl md:text-2xl leading-tight hover:text-samara-gold transition-colors line-clamp-2 pr-4"
                          >
                              {item.product.name}
                          </Link>
                          {/* Mobile Trash Icon */}
                          <button 
                              onClick={() => removeFromCart(item.id)}
                              className="sm:hidden text-samara-ivory/40 hover:text-red-400 transition-colors"
                          >
                              <Trash2 className="h-4 w-4 stroke-[1.5]" />
                          </button>
                      </div>

                      {/* Variant Info */}
                      {(item.variant?.size || item.variant?.color) && (
                        <div className="flex gap-4 mt-3 text-[10px] font-sans tracking-[0.1em] text-samara-ivory/60 uppercase">
                            {item.variant.size && <span>Size: {item.variant.size}</span>}
                            {item.variant.color && <span>Color: {item.variant.color}</span>}
                        </div>
                      )}
                      
                      {/* Price per unit */}
                      <p className="text-samara-ivory/60 text-xs mt-2 font-sans">
                          {formatPriceSync(item.unit_price, item.currency)}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-4">
                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center border border-samara-ivory/20">
                        <button
                          className="h-8 w-8 flex items-center justify-center text-samara-ivory/60 hover:text-samara-gold hover:bg-samara-gold/10 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-samara-ivory/60"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </button>

                        <span className="w-8 text-center text-xs font-sans">{item.quantity}</span>

                        <button
                          className="h-8 w-8 flex items-center justify-center text-samara-ivory/60 hover:text-samara-gold hover:bg-samara-gold/10 transition-colors"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* ROW TOTAL PRICE */}
                      <div className="text-right">
                          <p className="text-xl font-serif text-samara-gold">
                              {formatPriceSync(item.unit_price * item.quantity, item.currency)}
                          </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Trash Icon */}
                  <div className="hidden sm:block">
                      <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-samara-ivory/40 hover:text-red-400 p-2 transition-colors"
                      >
                          <Trash2 className="h-5 w-5 stroke-[1.5]" />
                      </button>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-4 text-samara-ivory/60 text-[11px] font-sans tracking-wide bg-samara-void1 p-5 border border-samara-ivory/10">
                <ShieldCheck className="h-5 w-5 text-samara-gold flex-shrink-0 stroke-[1.5]" />
                <p>Safe and secure checkout. 100% Authentic handcrafted pieces.</p>
              </div>
            </div>

            {/* RIGHT SIDE: ORDER SUMMARY */}
            <div className="h-fit sticky top-32">
                <div className="border border-samara-ivory/10 bg-samara-void1 p-6 lg:p-8">
                <h2 className="text-2xl font-serif mb-8 text-samara-gold border-b border-samara-ivory/10 pb-4">
                    Order Summary
                </h2>

                {/* Subtotal */}
                <div className="flex justify-between text-sm font-sans mb-4">
                    <span className="text-samara-ivory/80">Subtotal</span>
                    <span className="text-samara-ivory">
                        {formatPriceSync(subtotal, cartCurrency)}
                    </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-sm font-sans mb-4">
                    <span className="text-samara-ivory/80">Shipping</span>
                    <span className="text-samara-gold/80">Calculated at Checkout</span>
                </div>

                {/* Discount */}
                {appliedCoupon && (
                    <div className="flex justify-between text-sm font-sans mb-4">
                        <span className="text-samara-gold">Coupon ({appliedCoupon.code})</span>
                        <span className="text-samara-gold">-{formatPriceSync(discount, cartCurrency)}</span>
                    </div>
                )}

                {/* COUPON INPUT */}
                <div className="mt-8 mb-8">
                    {appliedCoupon ? (
                        <div className="flex justify-between items-center bg-samara-gold/10 border border-samara-gold/30 p-4">
                            <span className="text-samara-gold text-[11px] font-sans tracking-wide uppercase">Code <b>{appliedCoupon.code}</b> applied</span>
                            <button onClick={handleRemoveCoupon} className="text-[10px] font-sans tracking-[0.1em] uppercase text-samara-ivory/60 hover:text-samara-ivory underline underline-offset-2">
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="flex">
                            <Input
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="bg-transparent rounded-none text-samara-ivory placeholder-samara-ivory/40 border-samara-ivory/20 focus:border-samara-gold focus:ring-0 h-12 text-sm font-sans"
                            />
                            <button
                            onClick={handleApplyCoupon}
                            disabled={loading || !couponCode}
                            className="bg-samara-ivory/10 hover:bg-samara-gold text-samara-ivory hover:text-samara-void px-6 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50 h-12 flex items-center justify-center"
                            >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </button>
                        </div>
                    )}
                </div>

                <div className="border-t border-samara-ivory/10 my-6"></div>

                {/* TOTAL */}
                <div className="flex justify-between items-end mb-8">
                    <span className="text-sm font-sans tracking-widest uppercase text-samara-ivory/80">Total</span>
                    <div className="text-right">
                        <span className="text-3xl font-serif text-samara-gold">
                            {formatPriceSync(total, cartCurrency)}
                        </span>
                        <p className="text-[10px] font-sans text-samara-ivory/40 mt-1 uppercase tracking-wide">
                            Inclusive of all taxes
                        </p>
                    </div>
                </div>

                {/* CHECKOUT BUTTON */}
                <Button
                    className="w-full h-14 rounded-none bg-samara-gold hover:bg-samara-goldDeep text-samara-void font-sans text-[11px] tracking-[0.2em] uppercase transition-colors"
                    asChild
                >
                    <Link
                    href={user 
                        ? `/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`
                        : `/auth/login?redirect=/checkout${appliedCoupon ? `&coupon=${appliedCoupon.code}` : ''}`
                    }
                    className="flex items-center justify-center gap-2"
                    >
                        {user ? (
                            <>Proceed to Checkout <ArrowRight className="h-4 w-4" /></>
                        ) : (
                            <>Sign in to Checkout <User className="h-4 w-4" /></>
                        )}
                    </Link>
                </Button>
                
                <div className="mt-6 text-center">
                    <Link href="/sarees" className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors border-b border-transparent hover:border-samara-gold pb-1">
                        Continue Shopping
                    </Link>
                </div>
                </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}