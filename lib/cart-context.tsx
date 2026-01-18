'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import { supabase } from './supabase/client';
import { useAuth } from './auth-context';

import { resolveFinalPrice } from '@/lib/resolve-product-price';
import { getUserRegion } from '@/lib/region/client';
import { getCurrencyRates } from '@/lib/currency-utils';

import type { Region } from '@/lib/landed-pricing';
import type { CurrencyCode } from '@/components/currency-selector';

/* ======================================================
   CONSTANTS
====================================================== */
const GUEST_CART_KEY = 'guest_cart';

/* ======================================================
   TYPES
====================================================== */

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;

  unit_price: number;     // Calculated on the fly (Display Price)
  unit_price_inr: number; // Stored in DB (Base INR Price)
  currency: string;       // Calculated on the fly
  region: Region;         // Calculated on the fly

  product: any;
  variant?: any;
  image_url?: string | null;
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;

  currency: CurrencyCode;
  rate: number;
  setCurrency: (currency: CurrencyCode) => void;

  addToCart: (
    productId: string,
    variantId?: string,
    quantity?: number
  ) => Promise<void>;

  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;

  getCartTotal: () => number;
}

/* ======================================================
   CONTEXT
====================================================== */

const CartContext = createContext<CartContextType | undefined>(undefined);

/* ======================================================
   PROVIDER
====================================================== */

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, session, loading: authLoading } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Global preference state
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [rate, setRate] = useState<number>(1);

  // ✅ FIX STEP 1: Initialize rates with a stable shape
  // This ensures 'rates.USD' is defined (albeit 0) on the first render, 
  // keeping React happy and preventing hydration mismatches.
  const [rates, setRates] = useState<Record<string, number>>(() => ({
    INR: 1,
    USD: 0,
    AED: 0,
    GBP: 0,
    CAD: 0,
    // Add other currencies if necessary, but this covers the main checks
  }));

  /* ======================================================
     1. LOAD CURRENCY RATES
  ===================================================== */

  useEffect(() => {
    const loadRates = async () => {
      const dbRates = await getCurrencyRates();
      setRates(dbRates);

      const saved = localStorage.getItem('currency');
      if (saved) {
        const { currency } = JSON.parse(saved);
        setCurrencyState(currency);
        setRate(dbRates[currency] ?? 1);
      } else {
        setCurrencyState('INR');
        setRate(1);
      }
    };

    loadRates();
  }, []);

  /* ======================================================
     2. SET CURRENCY PREFERENCE
  ===================================================== */

  const setCurrency = (newCurrency: CurrencyCode) => {
    const newRate = rates[newCurrency] ?? 1;

    setCurrencyState(newCurrency);
    setRate(newRate);

    localStorage.setItem(
      'currency',
      JSON.stringify({ currency: newCurrency })
    );
  };

  /* ======================================================
     3. FETCH CART (DB)
  ===================================================== */

  const fetchCart = async () => {
    if (!session || !user) return; 

    // ✅ FIX STEP 3: HARD GUARD (Kept as requested)
    // We check for USD specifically to ensure the async fetch has likely completed.
    if (!rates || !rates.USD) {
      console.warn('Cart fetch skipped: exchange rates not ready');
      return;
    }
    
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          unit_price_inr,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', user.id);

      if (error || !data) {
        console.error('Error fetching cart:', error);
        setItems([]);
        return;
      }

      const currentRegion = getUserRegion();

      const cartItems: CartItem[] = await Promise.all(
        data.map(async (item: any) => {
          // 1. Fetch primary image
          const { data: img } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', item.product_id)
            .eq('is_primary', true)
            .maybeSingle();

          // 2. Fetch product prices to recalculate display values
          const { data: productData } = await supabase
             .from('products')
             .select('product_prices(*)')
             .eq('id', item.product_id)
             .single();
          
          const productWithPrices = { 
            ...item.product, 
            product_prices: productData?.product_prices || [] 
          };

          // Safety Fallback for price resolution
          let resolved;
          try {
            resolved = await resolveFinalPrice(
              productWithPrices,
              currentRegion,
              undefined,
              rates
            );
          } catch (e) {
            console.error('Price resolve failed in cart, falling back to INR', e);
            resolved = {
              displayPrice: item.unit_price_inr,
              currency: 'INR',
              inrBase: item.unit_price_inr,
              mrp: null,
              discountPct: 0,
              source: 'inr',
            };
          }

          return {
            ...item,
            unit_price: resolved.displayPrice, 
            currency: resolved.currency,
            region: currentRegion,
            image_url: img?.image_url || null,
          };
        })
      );

      setItems(cartItems);

    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     4. EFFECT: LOAD CART (GUEST OR USER)
  ===================================================== */

  useEffect(() => {
    if (authLoading) return;

    if (session && user) {
      fetchCart();
    } else {
      const guestCart = JSON.parse(
        localStorage.getItem(GUEST_CART_KEY) || '[]'
      );
      setItems(guestCart);
      setLoading(false);
    }
  // ✅ FIX STEP 2: KEEP RATES IN DEPENDENCY ARRAY
  // This ensures the effect re-runs once the rates state updates from 0 -> Actual Value
  }, [session, user, authLoading, rates]);

  /* ======================================================
     5. EFFECT: MIGRATE GUEST CART TO DB
  ===================================================== */

  useEffect(() => {
    if (!session || !user) return;

    const guestCart = JSON.parse(
      localStorage.getItem(GUEST_CART_KEY) || '[]'
    );

    if (!guestCart.length) return;

    const migrate = async () => {
      // Upsert all guest items to Supabase
      for (const item of guestCart) {
        await supabase.from('cart_items').upsert({
          user_id: user.id,
          product_id: item.product_id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          unit_price_inr: item.unit_price_inr,
        }, {
          onConflict: 'user_id,product_id,variant_id'
        });
      }

      localStorage.removeItem(GUEST_CART_KEY);
      fetchCart();
    };

    migrate();
    
  }, [session, user]); 

  /* ======================================================
     6. ADD TO CART
  ===================================================== */

  const addToCart = async (
    productId: string,
    variantId?: string,
    quantity: number = 1
  ) => {
    const region = getUserRegion(); 

    // 2. Fetch product + prices
    const { data: product } = await supabase
      .from('products')
      .select(`
        *,
        product_prices (
          region,
          currency,
          price
        )
      `)
      .eq('id', productId)
      .single();

    if (!product) return;

    // 3. Resolve the exact price
    const resolved = await resolveFinalPrice(
      product, 
      region, 
      undefined, 
      rates
    );
    
    const unitPrice = resolved.displayPrice; 
    const unitPriceINR = resolved.inrBase;
    const displayCurrency = resolved.currency;

    /* ----------------------------------------------------
       SCENARIO A: GUEST USER (Local Storage)
    ---------------------------------------------------- */
    if (!session) {
      const guestCart = JSON.parse(
        localStorage.getItem(GUEST_CART_KEY) || '[]'
      );

      const existingIndex = guestCart.findIndex(
        (item: any) =>
          item.product_id === productId &&
          item.variant_id === variantId
      );

      if (existingIndex > -1) {
        guestCart[existingIndex].quantity += quantity;
      } else {
        const { data: img } = await supabase
          .from('product_images')
          .select('image_url')
          .eq('product_id', productId)
          .eq('is_primary', true)
          .maybeSingle();

        guestCart.push({
          id: crypto.randomUUID(), 
          product_id: productId,
          variant_id: variantId,
          quantity,
          unit_price: unitPrice,
          unit_price_inr: unitPriceINR, 
          currency: displayCurrency,
          region, 
          product, 
          image_url: img?.image_url || null,
        });
      }

      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
      setItems(guestCart);
      return;
    }

    /* ----------------------------------------------------
       SCENARIO B: LOGGED-IN USER (Database)
    ---------------------------------------------------- */
    if (user) {
      const { error } = await supabase
        .from('cart_items')
        .insert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId ?? null,
          quantity,
          unit_price_inr: unitPriceINR,
        });
        
      if (error) {
        console.error('❌ CART INSERT ERROR:', error.message);
        return;
      }
      
      console.log('✅ CART INSERTED');
      fetchCart();
    }
  };

  /* ======================================================
     7. UPDATE QUANTITY
  ===================================================== */

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    // GUEST
    if (!session) {
      const guestCart = [...items];
      const index = guestCart.findIndex((i) => i.id === itemId);
      
      if (index > -1) {
        guestCart[index].quantity = quantity;
        setItems(guestCart);
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(guestCart));
      }
      return;
    }

    // USER
    if (user) {
      await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', user.id);

      fetchCart();
    }
  };

  /* ======================================================
     8. REMOVE FROM CART
  ===================================================== */

  const removeFromCart = async (itemId: string) => {
    // GUEST
    if (!session) {
      const updatedCart = items.filter((i) => i.id !== itemId);
      setItems(updatedCart);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedCart));
      return;
    }

    // USER
    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      fetchCart();
    }
  };

  /* ======================================================
     9. CLEAR CART
  ===================================================== */

  const clearCart = async () => {
    // GUEST
    if (!session) {
      setItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      return;
    }

    // USER
    if (user) {
      await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      setItems([]);
    }
  };

  /* ======================================================
     10. TOTAL HELPER
  ===================================================== */

  const getCartTotal = () =>
    items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        currency,
        rate,
        setCurrency,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ======================================================
   SAFE HOOK
====================================================== */

export function useCart(): CartContextType {
  const ctx = useContext(CartContext);

  if (!ctx) {
    throw new Error('useCart must be used within CartProvider');
  }

  return ctx;
}