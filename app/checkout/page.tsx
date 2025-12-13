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

  const {
    items,
    currency,
    rate,
    getCartTotalInINR,
    getCartTotalInSelectedCurrency,
    clearCart,
  } = useCart();

  const [loading, setLoading] = useState(false);
  const [discountINR, setDiscountINR] = useState(0);

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

  // Load logic
  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    if (couponCode) {
      fetchCouponDiscount();
    }

    if (!checkoutTracked) {
      trackAnalyticsEvent('checkout_started', undefined, undefined, user.id);
      setCheckoutTracked(true);
    }
  }, [user, items, couponCode, checkoutTracked]);

  const fetchCouponDiscount = async () => {
    if (!couponCode) return;

    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', couponCode)
      .eq('is_active', true)
      .maybeSingle();

    if (!coupon) return;

    const subtotalINR = getCartTotalInINR();

    let discount = 0;

    if (coupon.type === 'PERCENTAGE') {
      discount = (subtotalINR * coupon.value) / 100;
    } else {
      discount = coupon.value;
    }

    if (coupon.max_discount_inr && discount > coupon.max_discount_inr) {
      discount = coupon.max_discount_inr;
    }

    setDiscountINR(discount);
  };

  // Place Order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const subtotalINR = getCartTotalInINR();
      const totalINR = subtotalINR - discountINR;

      const orderNumber = `ORD${Date.now()}`;

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user!.id,
          order_number: orderNumber,
          subtotal_inr: subtotalINR,
          discount_inr: discountINR,
          shipping_inr: 0,
          total_amount_inr: totalINR,
          currency,
          exchange_rate: rate,
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

  // Totals
  const subtotalINR = getCartTotalInINR();
  const totalINR = subtotalINR - discountINR;

  const subtotalConverted = subtotalINR / rate;
  const discountConverted = discountINR / rate;
  const totalConverted = totalINR / rate;

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8 text-white">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT SIDE — FORM */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 text-white">

              <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* NAME */}
                <div className="md:col-span-2">
                  <Label className="text-white">Full Name</Label>
                  <Input
                    required
                    className="bg-white text-black"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <Label className="text-white">Email</Label>
                  <Input
                    type="email"
                    required
                    className="bg-white text-black"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                {/* PHONE */}
                <div>
                  <Label className="text-white">Phone</Label>
                  <Input
                    type="tel"
                    required
                    className="bg-white text-black"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>

                {/* ADDRESS */}
                <div className="md:col-span-2">
                  <Label className="text-white">Address</Label>
                  <Input
                    required
                    className="bg-white text-black"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </div>

                {/* CITY */}
                <div>
                  <Label className="text-white">City</Label>
                  <Input
                    required
                    className="bg-white text-black"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                  />
                </div>

                {/* STATE */}
                <div>
                  <Label className="text-white">State</Label>
                  <Input
                    required
                    className="bg-white text-black"
                    value={formData.state}
                    onChange={(e) =>
                      setFormData({ ...formData, state: e.target.value })
                    }
                  />
                </div>

                {/* PINCODE */}
                <div>
                  <Label className="text-white">Pincode</Label>
                  <Input
                    required
                    className="bg-white text-black"
                    value={formData.pincode}
                    onChange={(e) =>
                      setFormData({ ...formData, pincode: e.target.value })
                    }
                  />
                </div>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : 'Place Order'}
              </Button>
            </form>
          </div>

          {/* RIGHT SIDE — ORDER SUMMARY */}
          <div>
            <div className="border border-gray-700 rounded-lg p-6 sticky top-24 text-white">

              <h2 className="text-xl font-bold mb-4">Order Summary</h2>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {items.map((item) => {
                  const priceINR =
                    item.product.base_price_inr +
                    (item.variant?.additional_price_inr || 0);

                  const priceConverted = priceINR / rate;

                  return (
                    <div key={item.id} className="flex gap-3">
                      <div className="relative w-16 h-16 rounded bg-gray-800 overflow-hidden">
                        {item.image_url && (
                          <Image
                            src={item.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        )}
                      </div>

                      <div className="flex-1 text-sm">
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-gray-400 text-xs">Qty: {item.quantity}</p>
                        <p className="font-semibold text-[#D4AF37]">
                          {formatPrice(priceConverted * item.quantity, currency)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="space-y-2 mb-6 pb-6 border-b border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-300">Subtotal</span>
                  <span className="text-[#D4AF37]">
                    {formatPrice(subtotalConverted, currency)}
                  </span>
                </div>

                {discountINR > 0 && (
                  <div className="flex justify-between text-[#4ADE80]">
                    <span>Discount</span>
                    <span>-{formatPrice(discountConverted, currency)}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-gray-300">Shipping</span>
                  <span className="text-gray-300">Free</span>
                </div>
              </div>

              <div className="flex justify-between text-xl font-bold">
                <span>Total</span>
                <span className="text-[#D4AF37]">
                  {formatPrice(totalConverted, currency)}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </>
  );
}
