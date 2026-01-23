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
      <div className="bg-black min-h-screen flex items-center justify-center">
         <div className="animate-pulse text-gray-800">Loading bag...</div>
      </div>
    );
  }

  // ✅ 3. SAFE EMPTY CHECK
  if (items.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center px-4">
        <Toaster />
        <div className="text-center max-w-md">
          <div className="w-24 h-24 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-6 border border-gray-800">
            <ShoppingBag className="h-10 w-10 text-gray-500" />
          </div>
          <h1 className="text-3xl font-serif font-bold mb-2 text-white">Your cart is empty</h1>
          <p className="text-gray-400 mb-8">
            Looks like you haven't added anything to your bag yet.
          </p>
          <Button 
            asChild 
            className="w-full sm:w-auto px-8 py-6 rounded-md bg-[#111] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all font-semibold tracking-wide"
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

      <div className="bg-black text-white min-h-screen pt-12 pb-24">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-6">
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-[#D4AF37]">
              Shopping Bag <span className="text-gray-500 text-lg font-sans font-normal ml-2">({items.length} Items)</span>
            </h1>
            <Link href="/sarees" className="hidden md:block text-gray-400 hover:text-white transition-colors text-sm underline underline-offset-4">
              Continue Shopping
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            
            {/* LEFT SIDE: PRODUCT LIST */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => (
                <div
                  key={item.id}
                  // ✅ STEP 4: Reduced padding (p-4)
                  className="flex flex-row gap-3 p-3 sm:gap-4 sm:p-6 border border-[#2a2a2a] bg-[#0b0b0b] rounded-xl hover:border-[#D4AF37]/30 transition-colors"

                >
                  {/* IMAGE - ✅ STEP 3: Reduced height (h-28 sm:h-32) */}
                  <div className="relative w-20 h-20 sm:w-32 sm:h-32 rounded-md overflow-hidden bg-gray-900 flex-shrink-0 border border-gray-800">

                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                          <Link
                              href={`/products/${item.product.slug}`}
                              // ✅ STEP 5: Refined text size
                              className="font-serif text-sm sm:text-lg font-semibold leading-tight hover:text-[#D4AF37] transition-colors line-clamp-2"

                          >
                              {item.product.name}
                          </Link>
                          {/* Mobile Trash Icon */}
                          <button 
                              onClick={() => removeFromCart(item.id)}
                              className="sm:hidden text-gray-500 hover:text-red-500"
                          >
                              <Trash2 className="h-4 w-4" />
                          </button>
                      </div>

                      {/* Variant Info */}
                      {(item.variant?.size || item.variant?.color) && (
                        <div className="flex gap-3 mt-1.5 text-sm text-gray-400">
                            {item.variant.size && <span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-xs border border-gray-800">Size: {item.variant.size}</span>}
                            {item.variant.color && <span className="bg-[#1a1a1a] px-2 py-0.5 rounded text-xs border border-gray-800">Color: {item.variant.color}</span>}
                        </div>
                      )}
                      
                      {/* Price per unit - ✅ STEP 6: Reduced spacing/size */}
                      <p className="text-gray-400 text-xs sm:text-sm mt-1">
                          {formatPriceSync(item.unit_price, item.currency)} / unit
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-3 sm:mt-4">
                      {/* QUANTITY CONTROLS */}
                      <div className="flex items-center gap-3 bg-[#1a1a1a] rounded-full p-1 border border-gray-800">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-black text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>

                        <span className="w-4 text-center text-sm font-medium">{item.quantity}</span>

                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full hover:bg-black text-gray-400 hover:text-white"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* ROW TOTAL PRICE */}
                      <div className="text-right">
                          <p className="text-lg font-bold text-[#D4AF37]">
                              {formatPriceSync(item.unit_price * item.quantity, item.currency)}
                          </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Desktop Trash Icon */}
                  <div className="hidden sm:block">
                      <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeFromCart(item.id)}
                          className="text-gray-600 hover:text-red-500 hover:bg-red-500/10 rounded-full"
                      >
                          <Trash2 className="h-5 w-5" />
                      </Button>
                  </div>
                </div>
              ))}
              
              <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm bg-[#111] p-4 rounded-lg border border-gray-800">
                <ShieldCheck className="h-5 w-5 text-green-500 flex-shrink-0" />
                <p>Safe and secure checkout. 100% Authentic products.</p>
              </div>
            </div>

            {/* RIGHT SIDE: ORDER SUMMARY */}
            <div className="h-fit sticky top-24">
                <div className="border border-[#D4AF37]/30 bg-[#0b0b0b] rounded-xl p-6 shadow-2xl shadow-black/50">
                <h2 className="text-xl font-serif font-bold mb-6 text-[#D4AF37] border-b border-gray-800 pb-4">
                    Order Summary
                </h2>

                {/* Subtotal */}
                <div className="flex justify-between text-gray-300 mb-3 text-sm">
                    <span>Subtotal</span>
                    <span className="font-medium text-white">
                        {formatPriceSync(subtotal, cartCurrency)}
                    </span>
                </div>

                {/* Shipping */}
                <div className="flex justify-between text-gray-300 mb-3 text-sm">
                    <span>Shipping</span>
                    <span className="text-green-400">Calculated at Checkout</span>
                </div>

                {/* Discount */}
                {appliedCoupon && (
                    <div className="flex justify-between text-green-400 mb-3 text-sm">
                        <span>Coupon ({appliedCoupon.code})</span>
                        <span>-{formatPriceSync(discount, cartCurrency)}</span>
                    </div>
                )}

                {/* COUPON INPUT */}
                <div className="mt-6 mb-6">
                    {appliedCoupon ? (
                        <div className="flex justify-between items-center bg-green-900/20 border border-green-500/30 p-3 rounded">
                            <span className="text-green-400 text-sm font-medium">Code <b>{appliedCoupon.code}</b> applied</span>
                            <button onClick={handleRemoveCoupon} className="text-xs text-red-400 hover:text-red-300 underline">
                                Remove
                            </button>
                        </div>
                    ) : (
                        <div className="flex gap-2">
                            <Input
                            placeholder="Coupon code"
                            value={couponCode}
                            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                            className="bg-[#1a1a1a] text-white placeholder-gray-500 border-gray-700 focus:border-[#D4AF37]"
                            />
                            <Button
                            onClick={handleApplyCoupon}
                            disabled={loading || !couponCode}
                            className="bg-white text-black hover:bg-gray-200"
                            >
                            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Apply'}
                            </Button>
                        </div>
                    )}
                </div>

                <div className="border-t border-dashed border-gray-700 my-4"></div>

                {/* TOTAL */}
                <div className="flex justify-between items-end mb-8">
                    <span className="text-lg font-bold text-white">Total Amount</span>
                    <div className="text-right">
                        <span className="text-2xl font-serif font-bold text-[#D4AF37]">
                            {formatPriceSync(total, cartCurrency)}
                        </span>
                        <p className="text-[10px] text-gray-500 mt-1">
                            (Inclusive of all taxes)
                        </p>
                    </div>
                </div>

                {/* CHECKOUT BUTTON */}
                <Button
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black hover:shadow-lg hover:shadow-[#D4AF37]/20 font-bold py-6 text-lg transition-all"
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
                            <>Checkout <ArrowRight className="h-5 w-5" /></>
                        ) : (
                            <>Sign in to Checkout <User className="h-5 w-5" /></>
                        )}
                    </Link>
                </Button>
                
                <div className="mt-4 text-center">
                    <Link href="/sarees" className="text-xs text-gray-500 hover:text-[#D4AF37] underline">
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