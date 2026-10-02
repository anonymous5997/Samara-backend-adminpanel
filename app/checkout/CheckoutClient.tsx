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
import { trackAnalyticsEvent } from '@/lib/analytics.client';
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
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 230, 0.2)', // samara-ivory/20
    color: 'rgba(255, 255, 230, 1)',
    minHeight: '3rem',
    borderRadius: '0', // rounded-none
    fontSize: '0.875rem',
    fontFamily: 'Manrope, sans-serif',
  }),
  menu: (base: any) => ({
    ...base,
    backgroundColor: '#0a0a0a', // samara-void1
    color: 'rgba(255, 255, 230, 1)',
    border: '1px solid rgba(255, 255, 230, 0.1)',
    zIndex: 50,
  }),
  option: (base: any, state: any) => ({
    ...base,
    backgroundColor: state.isFocused ? 'rgba(212,175,55,0.1)' : 'transparent',
    color: state.isFocused ? '#D4AF37' : 'rgba(255, 255, 230, 1)',
    cursor: 'pointer',
    fontSize: '0.875rem',
  }),
  singleValue: (base: any) => ({ ...base, color: 'rgba(255, 255, 230, 1)' }),
  input: (base: any) => ({ ...base, color: 'rgba(255, 255, 230, 1)' }),
  placeholder: (base: any) => ({ ...base, color: 'rgba(255, 255, 230, 0.4)' }),
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
      country: 'IN', 
    }));
  }, [profile]);

  /* ---------------- PIN CODE AUTO-FETCH (Step 8) ---------------- */
  const fetchAddressFromPincode = async (pincode: string) => {
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
          state: po.State,
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

      await trackAnalyticsEvent('checkout_started', undefined, order.id, auth.user.id);

      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: Math.round(totalINR * 100), 
        currency: 'INR',
        name: 'Samara',
        description: `Order #${order.id}`,
        
        handler: async (response: any) => {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              razorpay_payment_id: response.razorpay_payment_id
            })
            .eq('id', order.id);

          await trackAnalyticsEvent(
            'checkout_completed',
            undefined,
            order.id,
            auth.user.id
          );

          await supabase.rpc('increment_saree_sales_today', {
            quantity: items.reduce((sum, i) => sum + i.quantity, 0)
          });

          if (!isBuyNow) await clearCart();
          sessionStorage.removeItem('buynow_product');

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
      <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          <div className="flex flex-col items-center justify-center mb-16 text-center">
            <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
              Secure Payment
            </span>
            <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory">
              <em className="italic text-samara-gold">Checkout</em>
            </h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
            
            {/* Shipping Form */}
            <form
              onSubmit={handleSubmit}
              className="lg:col-span-2 space-y-8 bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12"
            >
              <h2 className="text-xl md:text-2xl font-serif text-samara-gold border-b border-samara-ivory/10 pb-4">
                Shipping Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Name */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">Name</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    placeholder="Full Name"
                    required
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                {/* Email */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">Email</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    placeholder="Email Address"
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">Phone</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    placeholder="Phone Number"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>

                {/* Country */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">
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
                <div className="md:col-span-2 space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">Address</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    placeholder="Street Address, Apt, Suite, etc."
                    required
                    value={formData.address}
                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                {/* Pincode */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">Pincode / Zip</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors"
                    placeholder="PINCODE"
                    value={formData.pincode}
                    onChange={e => {
                      const value = e.target.value;
                      setFormData({ ...formData, pincode: value });
                      if (formData.country === 'IN' && value.length === 6) {
                        fetchAddressFromPincode(value);
                      }
                    }}
                    required={formData.country === 'IN'}
                  />
                </div>

                {/* State */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">
                    State / Province
                  </label>
                  <Select
                    options={stateOptions}
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

                {/* City */}
                <div className="space-y-4">
                  <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">City</label>
                  <Input
                    className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors disabled:opacity-50"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                    disabled={formData.country === 'IN'}
                  />
                </div>

                {/* District */}
                {formData.country === 'IN' && (
                  <div className="md:col-span-2 space-y-4">
                    <label className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/60 block">District</label>
                    <Input
                      className="bg-transparent text-samara-ivory border-samara-ivory/20 focus:border-samara-gold focus:ring-0 rounded-none h-12 text-sm font-sans placeholder:text-samara-ivory/40 transition-colors disabled:opacity-50"
                      placeholder="District"
                      value={formData.district}
                      disabled
                    />
                  </div>
                )}
              </div>

              <div className="pt-8 flex flex-col items-center">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-14 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[11px] tracking-[0.2em] uppercase transition-colors"
                >
                  {loading ? 'Processing...' : `Pay ${formatPriceSync(total, displayCurrency)}`}
                </Button>
                
                {displayCurrency !== 'INR' && (
                  <p className="text-[10px] font-sans tracking-widest text-samara-ivory/40 uppercase mt-4 text-center">
                    *Your card will be charged in INR equivalent (≈ {formatPriceSync(totalINR, 'INR')})
                  </p>
                )}
              </div>
            </form>

            {/* Order Summary */}
            <div className="h-fit sticky top-32">
              <div className="bg-samara-void1 border border-samara-ivory/10 p-6 lg:p-8">
                <h2 className="text-xl md:text-2xl font-serif text-samara-gold mb-8 border-b border-samara-ivory/10 pb-4">Order Summary</h2>

                <div className="space-y-6 mb-8 max-h-[40vh] overflow-y-auto pr-4 custom-scrollbar">
                  {items.map(item => (
                    <div key={item.id} className="flex gap-4 border-b border-samara-ivory/10 pb-6 last:border-0">
                      <div className="relative w-20 h-28 flex-shrink-0 bg-samara-void">
                        {item.image_url ? (
                          <Image
                            src={item.image_url}
                            alt={item.product.name}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-sans tracking-widest text-samara-ivory/40 uppercase">Img</div>
                        )}
                      </div>
                      <div className="flex-1 flex flex-col justify-between">
                        <p className="font-serif text-lg text-samara-ivory line-clamp-2 leading-tight">{item.product.name}</p>
                        <div className="flex justify-between items-end mt-4">
                          <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60">Qty: {item.quantity}</p>
                          <p className="text-samara-gold font-serif text-xl">
                            {formatPriceSync(item.product.final_price, displayCurrency)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* COUPON INPUT */}
                <div className="mb-8">
                  <div className="flex">
                    <Input
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={e => setCouponCode(e.target.value.toUpperCase())}
                      className="bg-transparent rounded-none text-samara-ivory placeholder-samara-ivory/40 border-samara-ivory/20 focus:border-samara-gold focus:ring-0 h-12 text-sm font-sans"
                    />
                    <button
                      onClick={applyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="bg-samara-ivory/10 hover:bg-samara-gold text-samara-ivory hover:text-samara-void px-6 font-sans text-[11px] tracking-[0.2em] uppercase transition-colors disabled:opacity-50 h-12 flex items-center justify-center"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                <div className="border-t border-samara-ivory/10 pt-6 space-y-4">
                  <div className="flex justify-between text-sm font-sans text-samara-ivory/80">
                    <span>Subtotal</span>
                    <span>{formatPriceSync(subtotal, displayCurrency)}</span>
                  </div>
                  
                  <div className="flex justify-between text-sm font-sans text-samara-ivory/80">
                    <span>Shipping</span>
                    <span className="text-samara-gold/80">Free</span>
                  </div>

                  {couponApplied && (
                    <div className="flex justify-between text-sm font-sans text-samara-gold">
                      <span>Discount</span>
                      <span>-{formatPriceSync(discountDisplay, displayCurrency)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-end pt-6 border-t border-samara-ivory/10 mt-6">
                    <span className="text-sm font-sans tracking-widest uppercase text-samara-ivory/80">Total</span>
                    <div className="text-right">
                        <span className="text-3xl font-serif text-samara-gold">
                          {formatPriceSync(total, displayCurrency)}
                        </span>
                        <p className="text-[10px] font-sans text-samara-ivory/40 mt-1 uppercase tracking-wide">
                            Inclusive of all taxes
                        </p>
                    </div>
                  </div>
                </div>
                
                <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-center text-samara-ivory/40 mt-8">
                  Secure payments powered by Razorpay
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}