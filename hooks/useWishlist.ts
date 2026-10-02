'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductImage } from '@/lib/types';
import { formatPriceSync } from '@/lib/currency-utils';

export interface WishlistEntry {
  product: Product;
  image?: ProductImage;
}

interface UseWishlistOptions {
  /** Fetch only while true (e.g. while a drawer is open). Default true. */
  enabled?: boolean;
}

/**
 * Wishlist data + actions, extracted unchanged from app/wishlist/page.tsx:
 * `wishlist_items` → products → primary product image, remove, add to bag,
 * and price display (base_price_inr * rate). Auth redirects stay with the
 * caller. Toasts need a <Toaster /> mounted by the caller.
 */
export function useWishlist({ enabled = true }: UseWishlistOptions = {}) {
  const { user } = useAuth();
  const { currency, rate, addToCart } = useCart();
  const [items, setItems] = useState<WishlistEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchWishlist = useCallback(async () => {
    if (!user) return;

    try {
      const { data: wishlistData } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', user.id);

      if (!wishlistData || wishlistData.length === 0) {
        setItems([]);
        setLoading(false);
        return;
      }

      const productIds = wishlistData.map((item) => item.product_id);

      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('id', productIds);

      if (products) {
        const productsWithImages = await Promise.all(
          products.map(async (product) => {
            const { data: image } = await supabase
              .from('product_images')
              .select('*')
              .eq('product_id', product.id)
              .eq('is_primary', true)
              .maybeSingle();

            return { product, image };
          })
        );
        setItems(productsWithImages);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Same trigger as the original page: refetch when the user or currency changes.
  useEffect(() => {
    if (!enabled || !user) return;
    fetchWishlist();
  }, [enabled, user, currency, fetchWishlist]);

  const removeFromWishlist = useCallback(
    async (productId: string) => {
      if (!user) return;

      try {
        await supabase
          .from('wishlist_items')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', productId);

        toast.success('Removed from wishlist');
        fetchWishlist();
      } catch {
        toast.error('Failed to remove from wishlist');
      }
    },
    [user, fetchWishlist]
  );

  const handleAddToCart = useCallback(
    async (productId: string) => {
      try {
        await addToCart(productId);
        toast.success('Added to cart');
      } catch {
        toast.error('Failed to add to cart');
      }
    },
    [addToCart]
  );

  const formatPrice = useCallback(
    (product: Product) => formatPriceSync(product.base_price_inr * rate, currency),
    [rate, currency]
  );

  return {
    user,
    items,
    loading,
    fetchWishlist,
    removeFromWishlist,
    handleAddToCart,
    formatPrice,
  };
}
