'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/currency';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  const cart = useCart();

  const mode = searchParams.get('mode');
  const isBuyNow = mode === 'buynow';

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- COUPON ---------------- */
  const [couponCode, setCouponCode] = useState('');
  const [discountINR, setDiscountINR] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  /* ---------------- RAZORPAY SCRIPT ---------------- */
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /* ---------------- BUY NOW ---------------- */
  useEffect(() => {
    if (!isBuyNow) return;
    const raw = sessionStorage.getItem('buynow_product');
    if (!raw) router.replace('/');
    else setBuyNowItem(JSON.parse(raw));
  }, [isBuyNow, router]);

  /* ---------------- AUTH ---------------- */
  useEffect(() => {
    if (!user) router.replace('/auth/login');
    if (!isBuyNow && cart.items.length === 0) router.replace('/cart');
  }, [user, cart.items.length, isBuyNow, router]);

  /* ---------------- FORM ---------------- */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });

  useEffect(() => {
    if (!profile) return;
    setFormData({
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.house
        ? `${profile.house}, ${profile.building}, ${profile.locality}`
        : '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pin || '',
    });
  }, [profile]);

  /* ---------------- ITEMS ---------------- */
  const items = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [
        {
          id: 'buynow',
          quantity: 1,
          product: {
            id: buyNowItem.productId,
            name: buyNowItem.productName,
            base_price_inr: buyNowItem.productPrice,
          },
          image_url: buyNowItem.image,
        },
      ];
    }
    return cart.items;
  }, [isBuyNow, buyNowItem, cart.items]);

  /* ---------------- TOTALS ---------------- */
  const subtotalINR = items.reduce(
    (sum, item) => sum + item.product.base_price_inr * item.quantity,
    0
  );

  const shippingINR = 0;
  const totalINR = subtotalINR - discountINR + shippingINR;

  /* ---------------- APPLY COUPON ---------------- */
  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    try {
      const code = couponCode.trim().toUpperCase();

      const { data: coupon } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle();

      if (!coupon) {
        toast.error('Invalid coupon');
        return;
      }

      /* ✅ MINIMUM ORDER CHECK */
      if (
        coupon.min_order_value_inr &&
        subtotalINR < coupon.min_order_value_inr
      ) {
        toast.error(
          `Minimum order ₹${coupon.min_order_value_inr} required for this coupon`
        );
        return;
      }

      let discount = 0;
      if (coupon.type === 'PERCENTAGE') {
        discount = (subtotalINR * coupon.value) / 100;
      } else {
        discount = coupon.value;
      }

      if (coupon.max_discount_inr) {
        discount = Math.min(discount, coupon.max_discount_inr);
      }

      setDiscountINR(discount);
      setCouponApplied(true);
      toast.success('Coupon applied');
    } finally {
      setCouponLoading(false);
    }
  };

  /* ---------------- PLACE ORDER ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not authenticated');

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: auth.user.id,
          subtotal_inr: subtotalINR,
          discount_inr: discountINR,
          shipping_inr: shippingINR,
          total_amount_inr: totalINR,
          status: 'pending',
          payment_status: 'pending',

          shipping_name: formData.name,
          shipping_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
        })
        .select('id')
        .single();

      if (error) throw error;

      await supabase.from('order_items').insert(
        items.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          unit_price_inr: item.product.base_price_inr,
          subtotal_inr:
            item.product.base_price_inr * item.quantity,
          image_url: item.image_url,
        }))
      );

      if (!isBuyNow) await cart.clearCart();
      sessionStorage.removeItem('buynow_product');

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: totalINR * 100,
        currency: 'INR',
        name: 'Samara',
        description: `Order ${order.id}`,
        handler: async () => {
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', order.id);

          router.replace(`/orders/${order.id}`);
        },
      });

      razorpay.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-black text-white px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-widest">
            CHECKOUT
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-4 border border-[#D4AF37]/30 rounded-xl p-6"
          >
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4">
              Shipping Details
            </h2>

            {Object.entries(formData).map(([key, value]) => (
              <Input
                key={key}
                className="bg-black text-white border-gray-700"
                placeholder={key.toUpperCase()}
                value={value}
                onChange={e =>
                  setFormData({ ...formData, [key]: e.target.value })
                }
              />
            ))}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-[#D4AF37] text-black font-bold"
            >
              {loading ? 'PROCESSING...' : 'PROCEED TO PAYMENT'}
            </Button>
          </form>

          <div className="border border-[#D4AF37]/30 rounded-xl p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            {items.map(item => (
              <div key={item.id} className="flex gap-3 mb-4">
                {item.image_url && (
                  <Image
                    src={item.image_url}
                    alt={item.product.name}
                    width={64}
                    height={64}
                    className="rounded object-cover"
                  />
                )}
                <div>
                  <p>{item.product.name}</p>
                  <p className="text-[#D4AF37]">
                    {formatPrice(item.product.base_price_inr, 'INR')}
                  </p>
                </div>
              </div>
            ))}

            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="bg-white text-black placeholder:text-gray-500"
              />
              <Button
                onClick={applyCoupon}
                disabled={couponLoading}
                className="bg-[#D4AF37] text-black"
              >
                Apply
              </Button>
            </div>

            <div className="border-t border-gray-700 pt-4 mt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatPrice(subtotalINR, 'INR')}</span>
              </div>

              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{formatPrice(discountINR, 'INR')}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#D4AF37]">
                  {formatPrice(totalINR, 'INR')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
