'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { formatPrice } from '@/lib/currency';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import Image from 'next/image';
import { trackAnalyticsEvent } from '@/lib/analytics';

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { items, currency, getCartTotal, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const [currencyRate, setCurrencyRate] = useState(1);
  const [discount, setDiscount] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  const couponCode = searchParams.get('coupon');
  const [checkoutTracked, setCheckoutTracked] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    fetchCurrencyRate();
    if (couponCode) {
      fetchCouponDiscount();
    }

    if (!checkoutTracked) {
      trackAnalyticsEvent('checkout_started', undefined, undefined, user.id);
      setCheckoutTracked(true);
    }
  }, [user, items, currency, couponCode, checkoutTracked]);

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

  const fetchCouponDiscount = async () => {
    if (!couponCode) return;

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('is_active', true)
      .maybeSingle();

    if (coupon) {
      const subtotal = getCartTotal();
      let discountAmount = 0;

      if (coupon.type === 'PERCENTAGE') {
        discountAmount = (subtotal * coupon.value) / 100;
      } else {
        discountAmount = coupon.value;
      }

      if (coupon.max_discount_inr && discountAmount > coupon.max_discount_inr) {
        discountAmount = coupon.max_discount_inr;
      }

      setDiscount(discountAmount);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotal = getCartTotal();
      const total = subtotal - discount;

      const orderNumber = `ORD${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          subtotal_inr: subtotal,
          discount_inr: discount,
          shipping_inr: 0,
          total_amount_inr: total,
          currency,
          exchange_rate: currencyRate,
          status: 'pending',
          payment_status: 'pending',
          shipping_name: formData.name,
          shipping_email: formData.email,
          shipping_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
          coupon_code: couponCode,
        })
        .select()
        .single();

      if (orderError || !order) {
        toast.error('Failed to create order');
        return;
      }

      const orderItems = items.map((item) => ({
        order_id: order.id,
        product_id: item.product.id,
        variant_id: item.variant?.id,
        product_name: item.product.name,
        variant_details: item.variant
          ? `${item.variant.size || ''} ${item.variant.color || ''}`.trim()
          : undefined,
        quantity: item.quantity,
        price_inr:
          item.product.base_price_inr +
          (item.variant?.additional_price_inr || 0),
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        toast.error('Failed to create order items');
        return;
      }

      await trackAnalyticsEvent('order_placed', undefined, order.id, user!.id);
      await clearCart();

      toast.success('Order placed successfully!');
      router.push(`/orders/${order.id}`);
    } catch (error) {
      toast.error('Failed to place order');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const subtotal = getCartTotal();
  const total = subtotal - discount;

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  Shipping Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      required
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      required
                      value={formData.city}
                      onChange={(e) =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      required
                      value={formData.state}
                      onChange={(e) =>
                        setFormData({ ...formData, state: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      required
                      value={formData.pincode}
                      onChange={(e) =>
                        setFormData({ ...formData, pincode: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </form>
          </div>

          <div>
            <div className="border rounded-lg p-6 sticky top-24">
              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
                {items.map((item) => {
                  const price =
                    item.product.base_price_inr +
                    (item.variant?.additional_price_inr || 0);

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded bg-gray-100 flex-shrink-0">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover rounded"
                          />
                        )}
                      </div>
                      <div className="flex-1 text-sm">
                        <p className="font-medium line-clamp-1">
                          {item.product.name}
                        </p>
                        {item.variant && (
                          <p className="text-gray-600 text-xs">
                            {item.variant.size || item.variant.color}
                          </p>
                        )}
                        <p className="text-gray-600">Qty: {item.quantity}</p>
                        <p className="font-semibold">
                          {formatPrice(price * item.quantity, currency, currencyRate)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-t pt-4">
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
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>Free</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span>{formatPrice(total, currency, currencyRate)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
