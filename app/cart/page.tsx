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
  const { items, currency, updateQuantity, removeFromCart, getCartTotal } = useCart();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [currencyRate, setCurrencyRate] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchCurrencyRate();
  }, [currency]);

  const fetchCurrencyRate = async () => {
    const { data } = await supabase
      .from('currency_rates')
      .select('rate')
      .eq('target_currency', currency)
      .maybeSingle();

    if (data) {
      setCurrencyRate(data.rate);
    }
  };

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
        toast.error('Coupon has expired');
        return;
      }

      const subtotal = getCartTotal();
      if (subtotal < coupon.min_cart_value_inr) {
        toast.error(`Minimum cart value of ₹${coupon.min_cart_value_inr} required`);
        return;
      }

      setAppliedCoupon(coupon);
      toast.success('Coupon applied successfully');
    } catch (error) {
      toast.error('Failed to apply coupon');
    } finally {
      setLoading(false);
    }
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;

    const subtotal = getCartTotal();
    let discount = 0;

    if (appliedCoupon.type === 'PERCENTAGE') {
      discount = (subtotal * appliedCoupon.value) / 100;
    } else {
      discount = appliedCoupon.value;
    }

    if (appliedCoupon.max_discount_inr && discount > appliedCoupon.max_discount_inr) {
      discount = appliedCoupon.max_discount_inr;
    }

    return discount;
  };

  const subtotal = getCartTotal();
  const discount = calculateDiscount();
  const total = subtotal - discount;

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">Please Sign In</h1>
          <p className="text-gray-600 mb-6">Sign in to view your cart</p>
          <Button asChild>
            <Link href="/auth/login">Sign In</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Toaster />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
            <p className="text-gray-600 mb-6">Add some products to get started</p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => {
                const price =
                  item.product.base_price_inr +
                  (item.variant?.additional_price_inr || 0);

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 border rounded-lg"
                  >
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                      {item.image_url ? (
                        <Image
                          src={item.image_url}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                          No Image
                        </div>
                      )}
                    </div>

                    <div className="flex-1">
                      <Link
                        href={`/products/${item.product.slug}`}
                        className="font-medium hover:underline"
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-sm text-gray-600">
                          {item.variant.size || item.variant.color}
                        </p>
                      )}
                      <p className="text-sm font-semibold mt-1">
                        {formatPrice(price, currency, currencyRate)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <div className="border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                <div className="flex gap-2">
                  <Input
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  />
                  <Button onClick={handleApplyCoupon} disabled={loading}>
                    Apply
                  </Button>
                </div>
                {appliedCoupon && (
                  <p className="text-sm text-green-600">
                    Coupon applied: {appliedCoupon.code}
                  </p>
                )}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal, currency, currencyRate)}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatPrice(discount, currency, currencyRate)}</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between text-xl font-bold mb-6">
                <span>Total</span>
                <span>{formatPrice(total, currency, currencyRate)}</span>
              </div>

              <Button className="w-full" size="lg" asChild>
                <Link
                  href={`/checkout${appliedCoupon ? `?coupon=${appliedCoupon.code}` : ''}`}
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
