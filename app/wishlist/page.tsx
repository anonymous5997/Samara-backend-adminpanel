'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';
import { Product, ProductImage } from '@/lib/types';
import { formatPriceSync } from '@/lib/currency-utils';
import { Heart, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { useRouter } from 'next/navigation';

export default function WishlistPage() {
  const router = useRouter();
  const { user } = useAuth();
  // ✅ Get 'rate' from context to handle conversions
  const { currency, rate, addToCart } = useCart();
  const [items, setItems] = useState<{ product: Product; image?: ProductImage }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchWishlist();
  }, [user, currency]); 

  const fetchWishlist = async () => {
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
  };

  const removeFromWishlist = async (productId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      toast.success('Removed from wishlist');
      fetchWishlist();
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (productId: string) => {
    try {
      await addToCart(productId);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Toaster />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-2xl mx-auto text-center">
            <Heart className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Your wishlist is empty</h1>
            <p className="text-gray-600 mb-6">
              Save your favorite products to come back to them later
            </p>
            <Button asChild>
              <Link href="/shop">Continue Shopping</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-8 text-white tracking-wide">
          My Wishlist
        </h1>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map(({ product, image }) => (
            <div
              key={product.id}
              className="group bg-[#0b0b0b] rounded-xl p-3 border border-[#D4AF37]/10 hover:border-[#D4AF37]/30 transition duration-300"
            >
              {/* Image Container */}
              <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-900 mb-3">
                <Link href={`/products/${product.slug}`}>
                  {image ? (
                    <Image
                      src={image.image_url}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500 bg-[#111]">
                      No Image
                    </div>
                  )}
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-md rounded-full h-8 w-8 transition-transform hover:scale-110"
                  onClick={() => removeFromWishlist(product.id)}
                >
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </Button>
              </div>

              {/* Product Info */}
              <Link href={`/products/${product.slug}`}>
                <h3 className="font-serif text-base md:text-lg font-semibold text-white tracking-wide leading-snug line-clamp-2 mb-1 hover:text-[#D4AF37] transition-colors">
                  {product.name}
                </h3>
              </Link>
              
              {/* Price */}
              <p className="font-serif text-lg font-bold text-[#D4AF37] tracking-wide mb-3">
                {formatPriceSync(product.base_price_inr * rate, currency)}
              </p>

              {/* Action Button */}
              <Button
                size="sm"
                className="w-full bg-[#111] border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37] hover:text-black transition-all font-semibold tracking-wide"
                onClick={() => handleAddToCart(product.id)}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Add to Cart
              </Button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}