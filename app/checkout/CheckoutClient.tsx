'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPriceSync } from '@/lib/currency-utils';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  
  // Get active currency from Cart Context for Display
  const { items: cartItems, clearCart, currency: activeCurrency } = useCart();

  const mode = searchParams.get('mode');
  const isBuyNow = mode === 'buynow';

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- COUPON STATE ---------------- */
  const [couponCode, setCouponCode] = useState('');
  
  // Two discount states: One for Math (INR), one for Display
  const [discountINR, setDiscountINR] = useState(0); 
  const [discountDisplay, setDiscountDisplay] = useState(0);
  
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

  /* ---------------- BUY NOW DATA LOAD (STEP 2: VALIDATION) ---------------- */
  useEffect(() => {
    if (!isBuyNow) return;
    
    // Retrieve the exact object structure saved in BuyNowModal
    const raw = sessionStorage.getItem('buynow_product');
    if (!raw) {
      router.replace('/');
      return;
    }
    
    try {
      const parsed = JSON.parse(raw);

      // ✅ STEP 2: HARD VALIDATION - Ensure INR price exists before rendering
      if (!parsed.unit_price_inr || parsed.unit_price_inr <= 0) {
        console.error("Invalid pricing in session storage:", parsed);
        toast.error('Invalid pricing data. Please try again.');
        router.replace('/');
        return;
      }

      setBuyNowItem(parsed);
    } catch (e) {
      console.error("Failed to parse buy now item", e);
      router.replace('/');
    }
  }, [isBuyNow, router]);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (!user) router.replace('/auth/login');
    if (!isBuyNow && cartItems.length === 0) router.replace('/cart');
  }, [user, cartItems.length, isBuyNow, router]);

  /* ---------------- FORM DATA ---------------- */
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

  /* ---------------- ITEMS LOGIC ---------------- */
  const items = useMemo(() => {
    // 1. BUY NOW MODE
    if (isBuyNow && buyNowItem) {
      return [
        {
          id: 'buynow',
          quantity: 1,
          product: {
            id: buyNowItem.productId,
            name: buyNowItem.productName,
            
            // DISPLAY price (e.g. 100 USD)
            final_price: buyNowItem.unit_price,

            // PAYMENT price (e.g. 8400 INR) - Crucial for Razorpay
            final_price_inr: buyNowItem.unit_price_inr,

            currency: buyNowItem.currency,
          },
          image_url: buyNowItem.image,
        },
      ];
    }
    
    // 2. CART MODE
    return cartItems.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        
        // DISPLAY price (User selected currency)
        final_price: item.unit_price, 

        // PAYMENT price (Base INR calculation stored in cart)
        final_price_inr: item.unit_price_inr, 

        currency: item.currency,
      },
      image_url: item.product.primary_image_url || item.image_url, 
    }));
  }, [isBuyNow, buyNowItem, cartItems]);

  /* ---------------- TOTALS (STEP 3: SAFE CALCULATION) ---------------- */
  
  // A. DISPLAY TOTALS (For UI Rendering - USD/AED/etc)
  const subtotal = items.reduce(
    (sum, item) => sum + (item.product.final_price * item.quantity),
    0
  );

  // B. PAYMENT TOTALS (For Razorpay/Database - INR)
  // ✅ STEP 3: DEFENSIVE CALCULATION
  const subtotalINR = items.reduce((sum, item) => {
    const price = Number(item.product.final_price_inr);
    // If price is NaN or 0, ignore it to avoid pollution, but typically guard blocks this
    if (!price || price <= 0) return sum; 
    return sum + (price * item.quantity);
  }, 0);

  const shippingINR = 0; // Assuming free shipping for now

  // C. FINAL TOTALS
  const total = subtotal - discountDisplay; 
  const totalINR = subtotalINR - discountINR + shippingINR;

  // Determine which currency code to use for display
  const displayCurrency = isBuyNow && buyNowItem ? buyNowItem.currency : activeCurrency;

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

      /* MINIMUM ORDER CHECK (Based on INR) */
      if (
        coupon.min_order_value_inr &&
        subtotalINR < coupon.min_order_value_inr
      ) {
        toast.error(
          `Minimum order ₹${coupon.min_order_value_inr} required for this coupon`
        );
        return;
      }

      // 1. Calculate INR Discount
      let calcDiscountINR = 0;
      if (coupon.type === 'PERCENTAGE') {
        calcDiscountINR = (subtotalINR * coupon.value) / 100;
      } else {
        calcDiscountINR = coupon.value;
      }

      if (coupon.max_discount_inr) {
        calcDiscountINR = Math.min(calcDiscountINR, coupon.max_discount_inr);
      }

      // 2. Calculate Display Discount (Proportional)
      const discountRatio = subtotalINR > 0 ? (calcDiscountINR / subtotalINR) : 0;
      const calcDiscountDisplay = subtotal * discountRatio;

      setDiscountINR(calcDiscountINR);
      setDiscountDisplay(calcDiscountDisplay);
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

    // ✅ STEP 1: CRITICAL GUARD
    // Prevent submission if items have no INR price calculated
    if (items.length === 0 || subtotalINR <= 0) {
      toast.error('Price not ready or invalid. Please refresh the page.');
      return;
    }

    setLoading(true);

    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not authenticated');

      // Create Order (Always stored in INR)
      // ✅ STEP 4: Math.max(1, ...) ensures DB never receives 0 for subtotal
      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: auth.user.id,
          total_amount: total,            // e.g. 200
          currency: displayCurrency,  
          subtotal_inr: Math.max(1, subtotalINR),
          discount_inr: discountINR,
          shipping_inr: shippingINR,
          total_amount_inr: Math.max(1, totalINR), // The amount Razorpay will charge
          status: 'pending',
          payment_status: 'pending',
          currency_used: displayCurrency, // Track what the user saw

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

      // Insert Order Items
      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        
        // Ensure price_inr is never null/0
        price_inr: item.product.final_price_inr || 0,
        // Optional: unit_price_inr if your schema uses that
        unit_price_inr: item.product.final_price_inr || 0,
        
        image_url: item.image_url,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // Cleanup
      if (!isBuyNow) await clearCart();
      sessionStorage.removeItem('buynow_product');

      // Initialize Payment (RAZORPAY ALWAYS TAKES INR)
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(totalINR * 100), // INR Paise
        currency: 'INR', // Strictly INR
        name: 'Samara',
        description: `Order ${order.id}`,
        handler: async (response: any) => {
          await supabase
            .from('orders')
            .update({ 
              payment_status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id 
            })
            .eq('id', order.id);

          // Direct redirect to Order Details
          router.replace(`/orders/${order.id}`);
        },
        prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
        },
        theme: {
            color: "#D4AF37"
        }
      });

      razorpay.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI RENDER ---------------- */
  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-black text-white px-4 py-10">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold tracking-widest font-serif text-[#D4AF37]">
            CHECKOUT
          </h1>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-2 space-y-4 border border-[#D4AF37]/30 rounded-xl p-6 bg-[#0b0b0b]"
          >
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4 font-serif">
              Shipping Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className={key === 'address' ? 'md:col-span-2' : ''}>
                   <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">{key}</label>
                   <Input
                    className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                    placeholder={key.toUpperCase()}
                    required
                    value={value}
                    onChange={e =>
                      setFormData({ ...formData, [key]: e.target.value })
                    }
                  />
                </div>
              ))}
            </div>

            {/* Pay Button shows Display Price (active currency) */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-bold py-6 text-lg mt-6 hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
            >
              {loading ? 'PROCESSING...' : `PAY ${formatPriceSync(total, displayCurrency)}`}
            </Button>
            <p className="text-xs text-center text-gray-500 mt-2">
              *Your card will be charged in INR equivalent (≈ {formatPriceSync(totalINR, 'INR')})
            </p>
          </form>

          {/* Order Summary */}
          <div className="border border-[#D4AF37]/30 rounded-xl p-6 h-fit bg-[#0b0b0b] sticky top-24">
            <h2 className="text-xl font-bold mb-6 font-serif text-[#D4AF37]">Order Summary</h2>

            <div className="space-y-4 mb-6 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {items.map(item => (
                <div key={item.id} className="flex gap-3 border-b border-gray-800 pb-4 last:border-0">
                  <div className="relative w-16 h-20 flex-shrink-0 bg-gray-900 rounded overflow-hidden">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-500">Img</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium line-clamp-2">{item.product.name}</p>
                    <div className="flex justify-between items-center mt-2">
                      <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                      {/* Show item price in Display Currency */}
                      <p className="text-[#D4AF37] font-semibold">
                        {formatPriceSync(item.product.final_price, displayCurrency)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mb-6">
              <Input
                placeholder="Coupon code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className="bg-white/10 text-white placeholder:text-gray-500 border-gray-700"
              />
              <Button
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode}
                className="bg-[#D4AF37] text-black hover:bg-[#F4D03F]"
              >
                Apply
              </Button>
            </div>

            <div className="border-t border-gray-700 pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-gray-400">
                <span>Subtotal</span>
                {/* Show Subtotal in Display Currency */}
                <span>{formatPriceSync(subtotal, displayCurrency)}</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>

              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  {/* Show Discount in Display Currency */}
                  <span>-{formatPriceSync(discountDisplay, displayCurrency)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
                <span>Total</span>
                {/* Show Total in Display Currency */}
                <span className="text-[#D4AF37]">
                  {formatPriceSync(total, displayCurrency)}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-center text-gray-500 mt-4">
              Secure payments powered by Razorpay
            </p>
          </div>
        </div>
      </div>
    </>
  );
}