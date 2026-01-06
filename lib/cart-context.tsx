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
import { getCurrencyRates } from '@/lib/currency/get-currency-rates';

import type { Region } from '@/lib/landed-pricing';
import type { CurrencyCode } from '@/components/currency-selector';

/* ======================================================
   TYPES
====================================================== */

export interface CartItem {
  id: string;
  product_id: string;
  variant_id?: string | null;
  quantity: number;

  unit_price: number;   // locked price at add-to-cart time
  currency: string;     // locked currency
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
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrencyState] = useState<CurrencyCode>('INR');
  const [rate, setRate] = useState<number>(1);
  const [rates, setRates] = useState<Record<string, number>>({ INR: 1 });

  /* ======================================================
     LOAD CURRENCY RATES (FROM SUPABASE)
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
     SET CURRENCY (FROM SELECTOR)
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
     FETCH CART
  ===================================================== */

  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          variant_id,
          quantity,
          unit_price,
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.id]);

  /* ======================================================
     ADD TO CART (PRICE LOCKED HERE)
  ===================================================== */

  const addToCart = async (
    productId: string,
    variantId?: string,
    quantity: number = 1
  ) => {
    if (!user) return;

    const region = getUserRegion();

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

    const { price, currency } = resolveFinalPrice(product, region);

    await supabase
      .from('cart_items')
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
          unit_price: price,
          currency,
          region,
        },
        { onConflict: 'user_id,product_id,variant_id' }
      );

    fetchCart();
  };

  /* ======================================================
     UPDATE / REMOVE
  ===================================================== */

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .eq('user_id', user.id);

    fetchCart();
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
      .eq('user_id', user.id);

    fetchCart();
  };

  const clearCart = async () => {
    if (!user) return;

    await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id);

    setItems([]);
  };

  /* ======================================================
     TOTAL (LOCKED PRICES)
  ===================================================== */

  const getCartTotal = () =>
    items.reduce(
      (sum, item) => sum + item.unit_price * item.quantity,
      0
    );

  /* ======================================================
     PROVIDER
  ===================================================== */

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
    return {
      items: [],
      loading: false,
      currency: 'INR',
      rate: 1,
      setCurrency: () => {},
      addToCart: async () => {},
      updateQuantity: async () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      getCartTotal: () => 0,
    };
  }

  return ctx;
}
