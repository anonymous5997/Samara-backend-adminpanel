'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Select from '@/components/ClientSelect';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPriceSync } from '@/lib/currency-utils';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
// ✅ Step 1: Import Analytics Tracker
import { trackAnalyticsEvent } from '@/lib/analytics.client';

// ✅ Step 4 Import Helpers
import { getCountries, getStatesByCountry } from '@/lib/location';

declare global {
  interface Window {
    Razorpay: any;
  }
}

// ✅ Step 10: Shared Styles for React Select
const selectStyles = {
  control: (base: any) => ({
    ...base,
    backgroundColor: '#000',
    borderColor: '#374151', // gray-700
    color: 'white',
    minHeight: '2.5rem',
    borderRadius: '0.375rem', // rounded-md
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#111',
    color: 'white',
    border: '1px solid #333',
    zIndex: 50,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? '#333' : '#111',
    color: 'white',
    cursor: 'pointer',
  }),
  singleValue: (base: any) => ({ ...base, color: 'white' }),
  input: (base: any) => ({ ...base, color: 'white' }),
  placeholder: (base: any) => ({ ...base, color: '#6b7280' }), // gray-500
};

export default function CheckoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile } = useAuth();
  
  const { items: cartItems, clearCart } = useCart();

  const mode = searchParams.get('mode');
  const isBuyNow = mode === 'buynow';

  const [buyNowItem, setBuyNowItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  /* ---------------- COUPON STATE ---------------- */
  const [couponCode, setCouponCode] = useState('');
  const [discountINR, setDiscountINR] = useState(0); 
  const [discountDisplay, setDiscountDisplay] = useState(0);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponApplied, setCouponApplied] = useState(false);

  /* ---------------- FORM DATA (Step 3) ---------------- */
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    country: 'IN', // Default to India
    state: '',
    city: '',
    district: '',
    pincode: '',
  });

  /* ---------------- LOCATION DATA (Step 5) ---------------- */
  const countryOptions = getCountries();
  const stateOptions = getStatesByCountry(formData.country);

  /* ---------------- RAZORPAY SCRIPT ---------------- */
  useEffect(() => {
    if (window.Razorpay) return;
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }, []);

  /* ---------------- BUY NOW DATA LOAD ---------------- */
  useEffect(() => {
    if (!isBuyNow) return;
    
    const raw = sessionStorage.getItem('buynow_product');
    if (!raw) {
      router.replace('/');
      return;
    }
    
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.unit_price_inr || parsed.unit_price_inr <= 0) {
        toast.error('Invalid pricing data. Please try again.');
        router.replace('/');
        return;
      }
      setBuyNowItem(parsed);
    } catch (e) {
      router.replace('/');
    }
  }, [isBuyNow, router]);

  /* ---------------- AUTH CHECK ---------------- */
  useEffect(() => {
    if (!user) router.replace('/auth/login');
    if (!isBuyNow && cartItems.length === 0) router.replace('/cart');
  }, [user, cartItems.length, isBuyNow, router]);

  /* ---------------- PROFILE PRE-FILL ---------------- */
  useEffect(() => {
    if (!profile) return;
    setFormData(prev => ({
      ...prev,
      name: profile.name || '',
      email: profile.email || '',
      phone: profile.phone || '',
      address: profile.house
        ? `${profile.house}, ${profile.building}, ${profile.locality}`
        : '',
      city: profile.city || '',
      state: profile.state || '',
      pincode: profile.pin || '',
      // Ensure country defaults to IN if not present, or use profile country code
      country: 'IN', 
    }));
  }, [profile]);

  /* ---------------- PIN CODE AUTO-FETCH (Step 8) ---------------- */
  const fetchAddressFromPincode = async (pincode: string) => {
    // Only fetch for India and valid length
    if (formData.country !== 'IN' || pincode.length !== 6) return;
  
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await res.json();
  
      if (data[0]?.Status === 'Success') {
        const po = data[0].PostOffice[0];
  
        setFormData(prev => ({
          ...prev,
          city: po.Block || po.Name,
          district: po.District,
          state: po.State, // This should match a label in stateOptions
        }));
        toast.success("Address details fetched!");
      } else {
        toast.error('Invalid PIN code');
      }
    } catch {
      toast.error('Failed to fetch address details');
    }
  };

  /* ---------------- DISPLAY CURRENCY LOGIC ---------------- */
  const displayCurrency = useMemo(() => {
    if (isBuyNow && buyNowItem) return buyNowItem.currency;
    if (cartItems.length > 0) return cartItems[0].currency;
    return 'INR';
  }, [isBuyNow, buyNowItem, cartItems]);

  /* ---------------- ITEMS LOGIC ---------------- */
  const items = useMemo(() => {
    if (isBuyNow && buyNowItem) {
      return [{
        id: 'buynow',
        quantity: 1,
        product: {
          id: buyNowItem.productId,
          name: buyNowItem.productName,
          final_price: buyNowItem.unit_price,
          final_price_inr: buyNowItem.unit_price_inr,
          currency: buyNowItem.currency,
        },
        image_url: buyNowItem.image,
      }];
    }
    
    return cartItems.map((item: any) => ({
      ...item,
      product: {
        ...item.product,
        final_price: item.unit_price, 
        final_price_inr: item.unit_price_inr, 
        currency: item.currency,
      },
      image_url: item.image_url || item.product.primary_image_url, 
    }));
  }, [isBuyNow, buyNowItem, cartItems]);

  /* ---------------- TOTALS CALCULATION ---------------- */
  const subtotal = items.reduce((sum, item) => sum + (item.product.final_price * item.quantity), 0);
  
  const subtotalINR = items.reduce((sum, item) => {
    const price = Number(item.product.final_price_inr);
    return (price && price > 0) ? sum + (price * item.quantity) : sum;
  }, 0);

  const shippingINR = 0;
  const total = subtotal - discountDisplay; 
  const totalINR = subtotalINR - discountINR + shippingINR;

  /* ---------------- COUPON LOGIC ---------------- */
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

      if (coupon.min_order_value_inr && subtotalINR < coupon.min_order_value_inr) {
        toast.error(`Minimum order ₹${coupon.min_order_value_inr} required`);
        return;
      }

      let calcDiscountINR = coupon.type === 'PERCENTAGE' 
        ? (subtotalINR * coupon.value) / 100 
        : coupon.value;

      if (coupon.max_discount_inr) {
        calcDiscountINR = Math.min(calcDiscountINR, coupon.max_discount_inr);
      }

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

  /* ---------------- SUBMIT ORDER ---------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    const invalidItems = items.some(i => !i.product.final_price_inr || i.product.final_price_inr <= 0);
    if (invalidItems || subtotalINR <= 0) {
      toast.error('Pricing error. Please refresh.');
      return;
    }

    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth?.user) throw new Error('Not authenticated');

      const { data: order, error } = await supabase
        .from('orders')
        .insert({
          user_id: auth.user.id,
          total_amount: total,            
          currency: displayCurrency,
          currency_used: displayCurrency,
          subtotal_inr: Math.max(1, subtotalINR),
          discount_inr: discountINR,
          shipping_inr: shippingINR,
          total_amount_inr: Math.max(1, totalINR), 
          status: 'pending',
          payment_status: 'pending',
          shipping_name: formData.name,
          shipping_phone: formData.phone,
          shipping_address: formData.address,
          shipping_city: formData.city,
          shipping_state: formData.state,
          shipping_pincode: formData.pincode,
          shipping_country: formData.country, 
        })
        .select('id')
        .single();

      if (error) throw error;

      const orderItems = items.map(item => ({
        order_id: order.id,
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price_inr: item.product.final_price_inr || 0,
        unit_price_inr: item.product.final_price_inr || 0,
        image_url: item.image_url,
      }));

      const { error: itemsError } = await supabase.from('order_items').insert(orderItems);
      if (itemsError) throw itemsError;

      // ✅ Step 3: Track Checkout Started (Correctly placed)
      await trackAnalyticsEvent('checkout_started', undefined, order.id, auth.user.id);

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(totalINR * 100), 
        currency: 'INR',
        name: 'Samara',
        description: `Order #${order.id}`,
        
        // ----------------------------------------------------
        // ✅ UPDATED HANDLER with Analytics & Sales Count
        // ----------------------------------------------------
        handler: async (response: any) => {
          console.log("✅ Razorpay payment success triggered");

          // 1. Update order payment
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id
            })
            .eq('id', order.id);

          // 2. Track Checkout Completed Event
          await trackAnalyticsEvent(
            'checkout_completed',
            undefined,
            order.id,
            auth.user.id
          );

          // 3. Increment Saree Sales Stats
          await supabase.rpc('increment_saree_sales_today', {
            quantity: items.reduce((sum, i) => sum + i.quantity, 0)
          });

          // 4. Clean up
          if (!isBuyNow) await clearCart();
          sessionStorage.removeItem('buynow_product');

          // 5. Redirect with slight delay
          setTimeout(() => {
            router.replace(`/orders/${order.id}`);
          }, 800);
        },
        modal: {
          ondismiss: async () => {
            await supabase.from('orders').update({ payment_status: 'cancelled' }).eq('id', order.id);
            toast.info('Payment cancelled.');
            setLoading(false);
          },
        },
        prefill: {
            name: formData.name,
            email: formData.email,
            contact: formData.phone
        },
        theme: { color: "#D4AF37" }
      });

      razorpay.open();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Order failed');
      setLoading(false);
    }
  };

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
              {/* Name */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">Name</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">Email</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                  placeholder="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">Phone</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              {/* ✅ STEP 6: Country Dropdown */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">
                  Country
                </label>
                <Select
                  options={countryOptions}
                  value={countryOptions.find(c => c.value === formData.country)}
                  onChange={(option: any) =>
                    setFormData({
                      ...formData,
                      country: option.value,
                      state: '',
                      city: '',
                      district: '',
                      pincode: '',
                    })
                  }
                  isSearchable
                  styles={selectStyles}
                />
              </div>

              {/* Address (Full width) */}
              <div className="md:col-span-2">
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">Address</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                  placeholder="Street Address, Apt, Suite, etc."
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
              </div>

              {/* ✅ STEP 8: Pincode */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">Pincode / Zip</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37]"
                  placeholder="PINCODE"
                  value={formData.pincode}
                  onChange={e => {
                    const value = e.target.value;
                    setFormData({ ...formData, pincode: value });
                    // Trigger fetch for India only
                    if (formData.country === 'IN' && value.length === 6) {
                      fetchAddressFromPincode(value);
                    }
                  }}
                  required={formData.country === 'IN'}
                />
              </div>

              {/* ✅ STEP 7: State Dropdown */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">
                  State / Province
                </label>
                <Select
                  options={stateOptions}
                  // We store the Label (Name) in formData.state, so we find by label for display
                  value={stateOptions.find(s => s.label === formData.state)}
                  onChange={(option: any) =>
                    setFormData({ ...formData, state: option.label })
                  }
                  isSearchable
                  isDisabled={stateOptions.length === 0}
                  placeholder={stateOptions.length === 0 ? "Select Country First" : "Select State"}
                  styles={selectStyles}
                />
              </div>

              {/* ✅ STEP 9: City Input */}
              <div>
                <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">City</label>
                <Input
                  className="bg-black text-white border-gray-700 focus:border-[#D4AF37] disabled:opacity-50"
                  placeholder="City"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  disabled={formData.country === 'IN'}
                />
              </div>

              {/* ✅ STEP 9: Optional District for IN */}
              {formData.country === 'IN' && (
                <div className="md:col-span-2">
                  <label className="text-xs text-gray-500 uppercase ml-1 mb-1 block">District</label>
                  <Input
                    className="bg-black text-white border-gray-700 focus:border-[#D4AF37] disabled:opacity-50"
                    placeholder="District"
                    value={formData.district}
                    disabled
                  />
                </div>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-bold py-6 text-lg mt-6 hover:shadow-lg hover:shadow-[#D4AF37]/20 transition-all"
            >
              {loading ? 'PROCESSING...' : `PAY ${formatPriceSync(total, displayCurrency)}`}
            </Button>
            
            {displayCurrency !== 'INR' && (
              <p className="text-xs text-center text-gray-500 mt-2">
                *Your card will be charged in INR equivalent (≈ {formatPriceSync(totalINR, 'INR')})
              </p>
            )}
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
                <span>{formatPriceSync(subtotal, displayCurrency)}</span>
              </div>
              
              <div className="flex justify-between text-gray-400">
                <span>Shipping</span>
                <span className="text-green-400">Free</span>
              </div>

              {couponApplied && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-{formatPriceSync(discountDisplay, displayCurrency)}</span>
                </div>
              )}

              <div className="flex justify-between font-bold text-lg pt-2 border-t border-gray-700">
                <span>Total</span>
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