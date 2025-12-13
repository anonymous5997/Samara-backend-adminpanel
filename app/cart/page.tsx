'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/currency';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { Coupon } from '@/lib/types';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function CartPage() {
  const { user } = useAuth();

  const {
    items,
    currency,
    rate,
    updateQuantity,
    removeFromCart,
    getCartTotalInINR,
    getCartTotalInSelectedCurrency,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculate totals
  const subtotalINR = getCartTotalInINR();
  const subtotalConverted = getCartTotalInSelectedCurrency();

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    let discount = 0;

    if (appliedCoupon.type === 'PERCENTAGE') {
      discount = (subtotalINR * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }

    if (appliedCoupon.max_discount_inr && discount > appliedCoupon.max_discount_inr) {
      discount = appliedCoupon.max_discount_inr;
    }

    return discount;
  };

  const discountINR = calculateDiscount();
  const totalINR = subtotalINR - discountINR;

  const totalConverted = subtotalConverted - (discountINR / rate);

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
        return;
      }

      const now = new Date();
      const validFrom = new Date(coupon.valid_from);
      const validTo = coupon.valid_to ? new Date(coupon.valid_to) : null;

      if (now < validFrom || (validTo && now > validTo)) {
        toast.error('Coupon is expired');
        return;
      }

      if (subtotalINR < coupon.min_cart_value_inr) {
        toast.error(`Minimum cart value of ₹${coupon.min_cart_value_inr} required`);
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully');
    } catch (err) {
      toast.error('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  // If user not logged in
  if (!user) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#f2d675]">
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  // If cart empty
  if (items.length === 0) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <Toaster />
        <div className="text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-500 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <Button asChild className="bg-[#D4AF37] text-black hover:bg-[#f2d675]">
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toaster />

      <div className="bg-black text-white min-h-screen pt-8 pb-16">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            {/* LEFT SIDE (Products) */}
            <div className="lg:col-span-2 space-y-6">
              {items.map((item) => {
                const priceINR =
                  (item.product.base_price_inr || 0) +
                  (item.variant?.additional_price_inr || 0);

                const priceConverted = priceINR / rate;

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border border-[#D4AF37]/20 bg-[#111] rounded-lg"
                  >
                    {/* IMAGE */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-900 flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-600 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    {/* DETAILS */}
                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-semibold hover:underline text-[#D4AF37]"
                      >
                        {item.product.name}
                      </Link>

                      {item.variant && (
                        <p className="text-sm text-gray-400">
                          {item.variant.size || item.variant.color}
                        </p>
                      )}

                      <p className="text-md font-bold mt-2 text-[#D4AF37]">
                        {formatPrice(priceINR, currency, rate)}
                      </p>
                    </div>

                    {/* QUANTITY */}
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37]"
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>

                      <span className="w-10 text-center">{item.quantity}</span>

                      <Button
                        size="icon"
                        variant="outline"
                        className="border-[#D4AF37] text-[#D4AF37]"
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>

                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                        className="text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* RIGHT SIDE (Order Summary) */}
            <div className="border border-[#D4AF37]/20 bg-[#111] rounded-lg p-6 h-fit sticky top-24">
              <h2 className="text-xl font-bold mb-4 text-[#D4AF37]">
                Order Summary
              </h2>

              {/* Coupon */}
              <div className="flex gap-2 mb-6">
                <Input
                  placeholder="Coupon code"
                  value={couponCode}
                  onChange={(e) =>
                    setCouponCode(e.target.value.toUpperCase())
                  }
                  className="bg-[#1a1a1a] text-white placeholder-gray-400 border-gray-700"
                />
                <Button
                  onClick={handleApplyCoupon}
                  disabled={loading}
                  className="bg-[#D4AF37] text-black hover:bg-[#f2d675]"
                >
                  Apply
                </Button>
              </div>

              {/* Subtotal */}
              <div className="flex justify-between text-gray-300 mb-2">
                <span>Subtotal</span>
                <span className="text-[#D4AF37] font-semibold">
                  {formatPrice(subtotalINR, currency, rate)}
                </span>
              </div>

              {/* Discount */}
              {discountINR > 0 && (
                <div className="flex justify-between text-green-500 mb-2">
                  <span>Discount</span>
                  <span>-{formatPrice(discountINR, currency, rate)}</span>
                </div>
              )}

              <hr className="my-4 border-gray-700" />

              {/* TOTAL */}
              <div className="flex justify-between text-xl font-bold mb-6 text-[#D4AF37]">
                <span>Total</span>
                <span>{formatPrice(totalINR, currency, rate)}</span>
              </div>

              {/* Checkout */}
              <Button
                className="w-full bg-[#D4AF37] text-black hover:bg-[#f2d675]"
                size="lg"
                asChild
              >
                <Link
                  href={`/checkout${
                    appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''
                  }`}
                >
                  Proceed to Checkout
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
