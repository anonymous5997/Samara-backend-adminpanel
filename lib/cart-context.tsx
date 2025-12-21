'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Currency } from './types';
import { supabase } from './supabase/client';
import { useAuth } from './auth-context';

import {
  getCurrencyRates,
  convertPriceSync,
} from '@/lib/currency-utils';

interface CartContextType {
  items: CartItem[];
  currency: Currency;
  rate: number;
  ratesMap: Map<string, number> | null;
  loading: boolean;

  addToCart: (
    productId: string,
    variantId?: string,
    quantity?: number
  ) => Promise<void>;

  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCurrency: (currency: Currency) => void;

  getCartTotalInINR: () => number;
  getCartTotalInSelectedCurrency: () => number;

  addBuyNowItem: (item: CartItem) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ----------------------------------------------------------------------
// AUTO-CURRENCY
// ----------------------------------------------------------------------
async function detectUserCurrency(): Promise<Currency> {
  try {
    const res = await fetch('https://ipapi.co/json/');
    const data = await res.json();

    switch (data.country_code) {
      case 'IN':
        return 'INR';
      case 'AE':
        return 'AED';
      case 'US':
        return 'USD';
      default:
        return 'INR';
    }
  } catch {
    return 'INR';
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [loading, setLoading] = useState(true);

  const [ratesMap, setRatesMap] = useState<Map<string, number> | null>(null);
  const [rate, setRate] = useState<number>(1);

  // ----------------------------------------------------------------------
  // Detect currency
  // ----------------------------------------------------------------------
  useEffect(() => {
    const stored = localStorage.getItem('samara_currency');
    if (stored) {
      setCurrency(stored as Currency);
    } else {
      detectUserCurrency().then((c) => {
        setCurrency(c);
        localStorage.setItem('samara_currency', c);
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('samara_currency', currency);
  }, [currency]);

  // ----------------------------------------------------------------------
  // Fetch cart
  // ----------------------------------------------------------------------
  const fetchCart = async () => {
    if (!user) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const { data } = await supabase
        .from('cart_items')
        .select(`
          id,
          quantity,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', user.id);

      if (!data) {
        setItems([]);
        return;
      }

      const cartItems: CartItem[] = await Promise.all(
        data.map(async (item: any) => {
          const { data: img } = await supabase
            .from('product_images')
            .select('image_url')
            .eq('product_id', item.product.id)
            .eq('is_primary', true)
            .maybeSingle();

          return {
            id: item.id,
            product: item.product,
            variant: item.variant,
            quantity: item.quantity,
            image_url: img?.image_url,
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

  // ----------------------------------------------------------------------
  // Currency rates
  // ----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const map = await getCurrencyRates();
        setRatesMap(map);
        setRate(currency === 'INR' ? 1 : map.get(currency) || 1);
      } catch {
        setRatesMap(null);
        setRate(1);
      }
    })();
  }, []);

  useEffect(() => {
    if (!ratesMap) {
      setRate(1);
      return;
    }
    setRate(currency === 'INR' ? 1 : ratesMap.get(currency) || 1);
  }, [currency, ratesMap]);

  // ----------------------------------------------------------------------
  // Cart ops
  // ----------------------------------------------------------------------
  const addToCart = async (
    productId: string,
    variantId?: string,
    quantity: number = 1
  ) => {
    if (!user) return;

    await supabase
      .from('cart_items')
      .upsert(
        {
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
        },
        { onConflict: 'user_id,product_id,variant_id' }
      );

    fetchCart();
  };

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
    await supabase.from('cart_items').delete().eq('user_id', user.id);
    setItems([]);
  };

  const addBuyNowItem = (item: CartItem) => {
    setItems([item]);
  };

  const getCartTotalInINR = () =>
    items.reduce((sum, item) => {
      const price =
        (item.product.base_price_inr || 0) +
        (item.variant?.additional_price_inr || 0);
      return sum + price * item.quantity;
    }, 0);

  const getCartTotalInSelectedCurrency = () =>
    convertPriceSync(getCartTotalInINR(), currency, ratesMap);

  return (
    <CartContext.Provider
      value={{
        items,
        currency,
        rate,
        ratesMap,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCurrency,
        getCartTotalInINR,
        getCartTotalInSelectedCurrency,
        addBuyNowItem,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* ---------------------------------------------------------------------- */
/* 🔥 SAFE HOOK (FIXES YOUR CRASH) */
/* ---------------------------------------------------------------------- */
export function useCart(): CartContextType {
  const ctx = useContext(CartContext);

  if (!ctx) {
    return {
      items: [],
      currency: 'INR',
      rate: 1,
      ratesMap: null,
      loading: false,

      addToCart: async () => {},
      updateQuantity: async () => {},
      removeFromCart: async () => {},
      clearCart: async () => {},
      setCurrency: () => {},

      getCartTotalInINR: () => 0,
      getCartTotalInSelectedCurrency: () => 0,

      addBuyNowItem: () => {},
    };
  }

  return ctx;
}
