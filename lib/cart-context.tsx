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
import { getCurrencyRates } from '@/lib/currency-utils'; // Ensure path matches your file structure

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

  unit_price: number;   // The locked price the user SAW (e.g. 250 for USD)
  unit_price_inr: number; // The locked Base INR price for payment processing
  currency: string;     // The locked currency (e.g. 'USD')
  region: Region;

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
  const { user, session } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Global preference state
  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [rate, setRate] = useState<number>(1);
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });

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
    if (!session || !user) return; // Guard for explicit DB calls

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
          unit_price_inr,
          currency,
          region,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', user.id);

      if (error || !data) {
        setItems([]);
        return;
      }

      const cartItems: CartItem[] = await Promise.all(
        data.map(async (item: any) => {
          // Fetch primary image for each item
          const { data: img } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', item.product_id)
            .eq('is_primary', true)
            .maybeSingle();

          return {
            ...item,
            image_url: img?.image_url || null,
          };
        })
      );

      setItems(cartItems);

      // Sync global currency state with cart contents
      // This ensures header currency matches what is in the cart
      if (cartItems.length > 0) {
        const cartCurrency = cartItems[0].currency as CurrencyCode;
        if (cartCurrency && cartCurrency !== currency) {
           setCurrencyState(cartCurrency);
        }
      }

    } finally {
      setLoading(false);
    }
  };

  /* ======================================================
     4. EFFECT: LOAD CART (GUEST OR USER)
  ===================================================== */

  useEffect(() => {
    // A. LOGGED IN → Fetch from DB
    if (session) {
      fetchCart();
      return;
    }

    // B. GUEST → Fetch from LocalStorage
    const guestCart = JSON.parse(
      localStorage.getItem(GUEST_CART_KEY) || '[]'
    );

    setItems(guestCart);
    setLoading(false);
    
  }, [session]);

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
          variant_id: item.variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          unit_price_inr: item.unit_price_inr,
          currency: item.currency,
          region: item.region,
        }, {
          onConflict: 'user_id,product_id,variant_id'
        });
      }

      // Cleanup LocalStorage and refresh DB cart
      localStorage.removeItem(GUEST_CART_KEY);
      fetchCart();
    };

    migrate();
    
  }, [session]);

  /* ======================================================
     6. ADD TO CART
  ===================================================== */

  const addToCart = async (
    productId: string,
    variantId?: string,
    quantity: number = 1
  ) => {
    // 1. Get current region
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
    // ✅ FIX: Pass 'undefined' for currency to force Region-based resolution
    // This ignores whatever the user selected in the UI and trusts the Region.
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
       SCENARIO A: GUEST USER
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
        // Explicitly fetch the primary image for guest cart
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
          unit_price_inr: unitPriceINR, // Guest cart already had this
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
       SCENARIO B: LOGGED-IN USER
    ---------------------------------------------------- */
    if (user) {
      await supabase
        .from('cart_items')
        .upsert(
          {
            user_id: user.id,
            product_id: productId,
            variant_id: variantId,
            quantity,
            unit_price: unitPrice,
            unit_price_inr: unitPriceINR,
            currency: displayCurrency,
            region,
          },
          { onConflict: 'user_id,product_id,variant_id' }
        );

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