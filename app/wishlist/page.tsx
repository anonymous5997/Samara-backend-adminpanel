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
      toast.success('Added to bag');
    } catch (error) {
      toast.error('Failed to add to bag');
    }
  };

  if (loading) {
    return (
      <div className="bg-samara-void min-h-screen flex items-center justify-center">
         <div className="animate-pulse text-samara-ivory/40 font-sans tracking-widest uppercase text-sm">Loading wishlist...</div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Toaster />
        <div className="bg-samara-void text-samara-ivory min-h-screen flex items-center justify-center px-4 pt-32 pb-24">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 bg-samara-void1 rounded-full flex items-center justify-center mx-auto mb-8 border border-samara-ivory/10">
              <Heart className="h-8 w-8 text-samara-ivory/40 stroke-[1.5]" />
            </div>
            <h1 className="text-4xl font-serif mb-4 text-samara-ivory">Your wishlist is empty</h1>
            <p className="text-sm font-sans tracking-wide text-samara-ivory/60 mb-10">
              Save your favorite pieces to come back to them later.
            </p>
            <Button 
              asChild 
              className="w-full sm:w-auto px-10 h-14 rounded-none bg-samara-gold hover:bg-samara-goldDeep text-samara-void transition-colors font-sans text-[11px] tracking-[0.2em] uppercase"
            >
              <Link href="/sarees">Start Shopping</Link>
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Toaster />
      <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
        <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
          <div className="flex items-end justify-between mb-12 border-b border-samara-ivory/10 pb-6">
            <div>
              <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
                Your Favorites
              </span>
              <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory">
                <em className="italic text-samara-gold">Wishlist</em>
              </h1>
            </div>
            <Link href="/sarees" className="hidden md:block text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors border-b border-transparent hover:border-samara-gold pb-1">
              Continue Shopping
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {items.map(({ product, image }) => (
              <div
                key={product.id}
                className="group block relative"
              >
                {/* Image Container */}
                <div className="relative aspect-[3/4] bg-samara-void1 border border-samara-gold/10 overflow-hidden mb-4 group-hover:border-samara-gold/30 transition-all duration-500">
                  <Link href={`/products/${product.slug}`}>
                    {image ? (
                      <Image
                        src={image.image_url}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-samara-ivory/40 font-sans text-[10px] tracking-widest uppercase">
                        No Image
                      </div>
                    )}
                  </Link>
                  <button
                    className="absolute top-4 right-4 h-8 w-8 rounded-full bg-samara-void/80 backdrop-blur border border-samara-ivory/20 flex items-center justify-center hover:bg-samara-void transition-colors"
                    onClick={() => removeFromWishlist(product.id)}
                  >
                    <Heart className="h-3.5 w-3.5 text-samara-gold fill-samara-gold stroke-[1.5]" />
                  </button>
                  <div className="absolute bottom-0 left-0 w-0 h-[2px] bg-samara-gold group-hover:w-full transition-all duration-500" />
                </div>

                {/* Product Info */}
                <Link href={`/products/${product.slug}`}>
                  <h3 className="font-serif text-base sm:text-lg md:text-xl text-samara-ivory group-hover:text-samara-gold transition-colors duration-300 leading-tight mb-2">
                    {product.name}
                  </h3>
                </Link>
                
                {/* Price */}
                <p className="font-sans text-sm md:text-base text-samara-gold/80 mb-4">
                  {formatPriceSync(product.base_price_inr * rate, currency)}
                </p>

                {/* Action Button */}
                <button
                  className="w-full h-10 border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold text-[10px] font-sans tracking-[0.2em] uppercase flex items-center justify-center gap-2 transition-colors"
                  onClick={() => handleAddToCart(product.id)}
                >
                  <ShoppingCart className="h-3.5 w-3.5 stroke-[1.5]" />
                  Add to Bag
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}