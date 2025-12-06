'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { CartItem, Currency } from './types';
import { supabase } from './supabase/client';
import { useAuth } from './auth-context';
import { trackAnalyticsEvent } from './analytics';

interface CartContextType {
  items: CartItem[];
  currency: Currency;
  loading: boolean;
  addToCart: (productId: string, variantId?: string, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  setCurrency: (currency: Currency) => void;
  getCartTotal: () => number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  currency: 'INR',
  loading: true,
  addToCart: async () => {},
  updateQuantity: async () => {},
  removeFromCart: async () => {},
  clearCart: async () => {},
  setCurrency: () => {},
  getCartTotal: () => 0,
});

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState<Currency>('INR');
  const [loading, setLoading] = useState(true);

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
          quantity,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', user.id);

      if (!error && data) {
        const cartItems: CartItem[] = await Promise.all(
          data.map(async (item: any) => {
            const { data: imageData } = await supabase
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
              image_url: imageData?.image_url,
            };
          })
        );
        setItems(cartItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, [user]);

  const addToCart = async (productId: string, variantId?: string, quantity: number = 1) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .upsert({
          user_id: user.id,
          product_id: productId,
          variant_id: variantId,
          quantity,
        }, {
          onConflict: 'user_id,product_id,variant_id',
        });

      if (!error) {
        await fetchCart();
        await trackAnalyticsEvent('add_to_cart', productId, undefined, user.id);
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (!user) return;

    try {
      if (quantity <= 0) {
        await removeFromCart(itemId);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (!error) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', user.id);

      if (!error) {
        await fetchCart();
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (!error) {
        setItems([]);
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const getCartTotal = () => {
    return items.reduce((total, item) => {
      const price = item.product.base_price_inr + (item.variant?.additional_price_inr || 0);
      return total + price * item.quantity;
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        currency,
        loading,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        setCurrency,
        getCartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
