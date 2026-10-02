'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Select from '@/components/ClientSelect';
import { Input } from '@/components/ui/input';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { formatPriceSync } from '@/lib/currency-utils';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  AccountHero,
  BTN_GOLD,
  FIELD,
  FIELD_ERROR,
  FIELD_LABEL,
  FIELD_LIGHT,
  StepHeading,
  samaraSelectStyles,
} from '@/components/account/ui';
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
    <div className="bg-samara-ink text-samara-ivory">
      <AccountHero
        eyebrow="Secure Checkout"
        title={<>Your <span className="sm-accent">checkout</span></>}
        aside={
          <ol aria-label="Checkout steps" className="flex items-center gap-4 font-sans text-[0.625rem] font-medium uppercase tracking-[0.22em] text-samara-mute">
            <li className="flex items-center gap-2"><span className="tabular-nums text-samara-gold">01</span> Contact</li>
            <li aria-hidden className="h-px w-6 bg-samara-line" />
            <li className="flex items-center gap-2"><span className="tabular-nums text-samara-gold">02</span> Delivery</li>
            <li aria-hidden className="h-px w-6 bg-samara-line" />
            <li className="flex items-center gap-2"><span className="tabular-nums text-samara-gold">03</span> Payment</li>
          </ol>
        }
      />

      <div className="sm-container grid grid-cols-1 gap-12 pb-20 pt-10 md:pb-28 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 lg:pt-14 xl:grid-cols-[minmax(0,1fr)_440px] xl:gap-24">

          {/* Shipping Form */}
          <form
            onSubmit={handleSubmit}
            className="min-w-0 space-y-14 md:space-y-16"
          >
            {/* 01 CONTACT */}
            <section aria-labelledby="checkout-contact" className="space-y-8">
              <StepHeading n="01" title={<span id="checkout-contact">Contact</span>} note="Shipping Details" />

              <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
              {/* Name */}
              <div className="md:col-span-2">
                <label htmlFor="checkout-name" className={FIELD_LABEL}>Name</label>
                <Input
                  id="checkout-name"
                  autoComplete="name"
                  className={cn(FIELD, 'peer')}
                  placeholder="Full Name"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                />
                <p className={FIELD_ERROR}>Please enter your full name.</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="checkout-email" className={FIELD_LABEL}>Email</label>
                <Input
                  id="checkout-email"
                  autoComplete="email"
                  className={cn(FIELD, 'peer')}
                  placeholder="Email Address"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                />
                <p className={FIELD_ERROR}>Please enter a valid email address.</p>
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="checkout-phone" className={FIELD_LABEL}>Phone</label>
                <Input
                  id="checkout-phone"
                  type="tel"
                  autoComplete="tel"
                  className={cn(FIELD, 'peer')}
                  placeholder="Phone Number"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                />
                <p className={FIELD_ERROR}>Please enter a phone number.</p>
              </div>
              </div>
            </section>

            {/* 02 DELIVERY */}
            <section aria-labelledby="checkout-delivery" className="space-y-8">
              <StepHeading n="02" title={<span id="checkout-delivery">Delivery</span>} note="Where should we send your order?" />

            <div className="grid grid-cols-1 gap-x-6 gap-y-7 md:grid-cols-2">
              {/* ✅ STEP 6: Country Dropdown */}
              <div className="md:col-span-2">
                <label id="checkout-country-label" className={FIELD_LABEL}>
                  Country
                </label>
                <Select
                  aria-labelledby="checkout-country-label"
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
                  styles={samaraSelectStyles}
                />
              </div>

              {/* Address (Full width) */}
              <div className="md:col-span-2">
                <label htmlFor="checkout-address" className={FIELD_LABEL}>Address</label>
                <Input
                  id="checkout-address"
                  autoComplete="street-address"
                  className={cn(FIELD, 'peer')}
                  placeholder="Street Address, Apt, Suite, etc."
                  required
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                />
                <p className={FIELD_ERROR}>Please enter your street address.</p>
              </div>

              {/* ✅ STEP 8: Pincode */}
              <div>
                <label htmlFor="checkout-pincode" className={FIELD_LABEL}>Pincode / Zip</label>
                <Input
                  id="checkout-pincode"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  className={cn(FIELD, 'peer tabular-nums')}
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
                <p className={FIELD_ERROR}>Please enter your PIN code.</p>
              </div>

              {/* ✅ STEP 7: State Dropdown */}
              <div>
                <label id="checkout-state-label" className={FIELD_LABEL}>
                  State / Province
                </label>
                <Select
                  aria-labelledby="checkout-state-label"
                  options={stateOptions}
                  // We store the Label (Name) in formData.state, so we find by label for display
                  value={stateOptions.find(s => s.label === formData.state)}
                  onChange={(option: any) =>
                    setFormData({ ...formData, state: option.label })
                  }
                  isSearchable
                  isDisabled={stateOptions.length === 0}
                  placeholder={stateOptions.length === 0 ? "Select Country First" : "Select State"}
                  styles={samaraSelectStyles}
                />
              </div>

              {/* ✅ STEP 9: City Input */}
              <div>
                <label htmlFor="checkout-city" className={FIELD_LABEL}>City</label>
                <Input
                  id="checkout-city"
                  className={cn(FIELD, 'peer')}
                  placeholder="City"
                  required
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  disabled={formData.country === 'IN'}
                />
                <p className={FIELD_ERROR}>Please enter your city.</p>
              </div>

              {/* ✅ STEP 9: Optional District for IN */}
              {formData.country === 'IN' && (
                <div>
                  <label htmlFor="checkout-district" className={FIELD_LABEL}>District</label>
                  <Input
                    id="checkout-district"
                    className={FIELD}
                    placeholder="District"
                    value={formData.district}
                    disabled
                  />
                </div>
              )}
            </div>
            </section>

            {/* 03 PAYMENT */}
            <section aria-labelledby="checkout-payment" className="space-y-8">
              <StepHeading n="03" title={<span id="checkout-payment">Payment</span>} />

              <div className="flex items-start gap-4 border border-samara-line bg-samara-char px-5 py-5">
                <Lock aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-samara-gold" strokeWidth={1.25} />
                <p className="font-sans text-sm leading-relaxed text-samara-mute">
                  Secure payments powered by Razorpay
                </p>
              </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(BTN_GOLD, 'min-h-[3.75rem] w-full text-[0.8125rem] tabular-nums')}
            >
              {loading ? 'PROCESSING...' : `PAY ${formatPriceSync(total, displayCurrency)}`}
            </button>
            
            {displayCurrency !== 'INR' && (
              <p className="-mt-4 text-center font-sans text-xs text-samara-mute">
                *Your card will be charged in INR equivalent (≈ {formatPriceSync(totalINR, 'INR')})
              </p>
            )}
            </section>
          </form>

          {/* Order Summary */}
          <aside
            aria-labelledby="checkout-summary-title"
            className="order-first h-fit bg-samara-cream px-6 py-8 text-samara-cream-ink sm:px-9 sm:py-10 lg:sticky lg:top-[calc(var(--sm-header-h)+2rem)] lg:order-none"
          >
            <h2 id="checkout-summary-title" className="font-serif text-[1.875rem] font-light leading-tight text-samara-cream-ink">
              Order <span className="italic text-samara-gold-deep">Summary</span>
            </h2>

            <ul className="mt-6 max-h-80 overflow-y-auto border-t border-samara-cream-ink/15 pr-1">
              {items.map(item => (
                <li key={item.id} className="flex gap-4 border-b border-samara-cream-ink/10 py-5 last:border-0">
                  <div className="relative aspect-[3/4] w-16 shrink-0 overflow-hidden bg-samara-cream-2">
                    {item.image_url ? (
                      <Image
                        src={item.image_url}
                        alt={item.product.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center font-sans text-[0.5625rem] uppercase tracking-[0.2em] text-samara-cream-mute">Img</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <p className="line-clamp-2 font-serif text-[1.0625rem] leading-snug">{item.product.name}</p>
                    <div className="mt-auto flex items-baseline justify-between gap-3 pt-2">
                      <p className="font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-cream-mute">Qty: {item.quantity}</p>
                      <p className="font-sans text-sm tabular-nums">
                        {formatPriceSync(item.product.final_price, displayCurrency)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <label htmlFor="checkout-coupon" className="mb-2.5 block font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-cream-mute">
                Coupon code
              </label>
              <div className="flex">
              <Input
                id="checkout-coupon"
                placeholder="Coupon code"
                value={couponCode}
                onChange={e => setCouponCode(e.target.value)}
                className={cn(FIELD_LIGHT, 'border-r-0')}
              />
              <button
                type="button"
                onClick={applyCoupon}
                disabled={couponLoading || !couponCode}
                className="flex h-12 min-w-[96px] shrink-0 items-center justify-center border border-samara-cream-ink bg-samara-cream-ink px-5 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-samara-cream transition-colors hover:border-samara-gold-deep hover:bg-samara-gold-deep disabled:opacity-40 focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-samara-cream-ink"
              >
                Apply
              </button>
              </div>
            </div>

            <dl className="mt-8 space-y-4 border-t border-samara-cream-ink/15 pt-6 font-sans text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-samara-cream-mute">Subtotal</dt>
                <dd className="tabular-nums">{formatPriceSync(subtotal, displayCurrency)}</dd>
              </div>
              
              <div className="flex justify-between gap-4">
                <dt className="text-samara-cream-mute">Shipping</dt>
                <dd>Free</dd>
              </div>

              {couponApplied && (
                <div className="flex justify-between gap-4 text-samara-gold-deep">
                  <dt>Discount</dt>
                  <dd className="tabular-nums">-{formatPriceSync(discountDisplay, displayCurrency)}</dd>
                </div>
              )}

              <div className="flex items-end justify-between gap-4 border-t border-samara-cream-ink/15 pt-6">
                <dt className="sm-eyebrow text-samara-cream-ink">Total</dt>
                <dd className="font-serif text-[2rem] leading-none tabular-nums">
                  {formatPriceSync(total, displayCurrency)}
                </dd>
              </div>
            </dl>
            
            <p className="mt-6 flex items-center justify-center gap-2 font-sans text-[0.6875rem] text-samara-cream-mute">
              <Lock aria-hidden className="h-3 w-3" strokeWidth={1.5} />
              Secure payments powered by Razorpay
            </p>
          </aside>
      </div>
    </div>
  );
}