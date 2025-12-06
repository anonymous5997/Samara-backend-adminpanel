'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductImage, Currency } from '@/lib/types';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  image?: ProductImage;
  currency: Currency;
  rate: number;
}

export function ProductCard({ product, image, currency, rate }: ProductCardProps) {
  const { user } = useAuth();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user || loading) return;

    setLoading(true);
    try {
      if (isWishlisted) {
        await supabase
          .from('wishlists')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        setIsWishlisted(false);
      } else {
        await supabase
          .from('wishlists')
          .insert({
            user_id: user.id,
            product_id: product.id,
          });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
        {image ? (
          <Image
            src={image.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/80 hover:bg-white"
            onClick={toggleWishlist}
            disabled={loading}
          >
            <Heart
              className={`h-5 w-5 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`}
            />
          </Button>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        {product.brand && (
          <p className="text-xs text-gray-500 mt-1">{product.brand}</p>
        )}
        <p className="mt-1 text-sm font-semibold">
          {formatPrice(product.base_price_inr, currency, rate)}
        </p>
      </div>
    </Link>
  );
}
