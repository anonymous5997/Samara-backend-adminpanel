// lib/cart-context.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Currency } from './types';
import { supabase } from './supabase/client';
import { useAuth } from './auth-context';
import { trackAnalyticsEvent } from './analytics';

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
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCurrency: (currency: Currency) => void;
  getCartTotalInINR: () => number;
  getCartTotalInSelectedCurrency: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// ----------------------------------------------------------------------
//  AUTO-CURRENCY BASED ON USER LOCATION
// ----------------------------------------------------------------------
async function detectUserCurrency(): Promise<Currency> {
  try {
    const res = await fetch("https://ipapi.co/json/");
    const data = await res.json();

    const country = data.country_code;

    switch (country) {
      case "IN":
        return "INR";
      case "AE":
        return "AED";
      case "US":
        return "USD";
      default:
        return "INR"; // fallback currency
    }
  } catch (err) {
    console.error("GeoIP error:", err);
    return "USD"; // fallback
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
  // 1️⃣ Detect auto currency on mount (only when user hasn't chosen manually)
  // ----------------------------------------------------------------------
  useEffect(() => {
    const storedCurrency = localStorage.getItem("samara_currency");

    if (!storedCurrency) {
      detectUserCurrency().then((detected) => {
        setCurrency(detected);
        localStorage.setItem("samara_currency", detected);
      });
    } else {
      setCurrency(storedCurrency as Currency);
    }
  }, []);

  // ----------------------------------------------------------------------
  // 2️⃣ Save currency whenever user changes it manually
  // ----------------------------------------------------------------------
  useEffect(() => {
    localStorage.setItem("samara_currency", currency);
  }, [currency]);

  // ----------------------------------------------------------------------
  // 3️⃣ Fetch cart items
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

      if (data) {
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
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user?.id]);

  // ----------------------------------------------------------------------
  // 4️⃣ Fetch currency rates (INR → other currencies)
  // ----------------------------------------------------------------------
  useEffect(() => {
    (async () => {
      try {
        const map = await getCurrencyRates();
        setRatesMap(map);

        if (currency === "INR") setRate(1);
        else setRate(map.get(currency) || 1);
      } catch {
        setRatesMap(null);
        setRate(1);
      }
    })();
  }, []);

  // Update rate when currency changes
  useEffect(() => {
    if (!ratesMap) {
      setRate(1);
      return;
    }

    if (currency === "INR") {
      setRate(1);
    } else {
      const r = ratesMap.get(currency);
      setRate(r && r > 0 ? r : 1);
    }
  }, [currency, ratesMap]);

  // ----------------------------------------------------------------------
  // CART OPERATIONS
  // ----------------------------------------------------------------------

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
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

  // ----------------------------------------------------------------------
  // TOTALS
  // ----------------------------------------------------------------------

  const getCartTotalInINR = () => {
    return items.reduce((sum, item) => {
      const price =
        (item.product.base_price_inr || 0) +
        (item.variant?.additional_price_inr || 0);

      return sum + price * item.quantity;
    }, 0);
  };

  const getCartTotalInSelectedCurrency = () => {
    const totalInINR = getCartTotalInINR();
    return convertPriceSync(totalInINR, currency, ratesMap);
  };

  // ----------------------------------------------------------------------
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be inside CartProvider");
  return ctx;
}
