'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductImage } from '@/lib/types';
import { formatPrice } from '@/lib/currency';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { useState } from 'react';
import { ResolvedPrice } from '@/lib/resolve-product-price';

interface ProductCardProps {
  product: Product;
  image?: ProductImage;
  price?: ResolvedPrice;
}

export function ProductCard({ product, image, price }: ProductCardProps) {
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
        await supabase.from('wishlists').insert({
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
      <div className="relative aspect-square overflow-hidden rounded-lg bg-[#111]">
        {image ? (
          <Image
            src={image.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image
          </div>
        )}

        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 backdrop-blur-md"
            onClick={toggleWishlist}
            disabled={loading}
          >
            <Heart
              className={`h-5 w-5 ${
                isWishlisted
                  ? 'fill-red-500 text-red-500'
                  : 'text-white'
              }`}
            />
          </Button>
        )}
      </div>

      <div className="mt-3">
        <h3 className="text-sm font-medium text-white line-clamp-2">
          {product.name}
        </h3>

        {product.brand && (
          <p className="text-xs text-gray-300 mt-1">
            {product.brand}
          </p>
        )}

        {/* PRICE */}
        {!price ? (
          <p className="mt-1 text-sm text-gray-500">—</p>
        ) : (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-sm font-semibold text-[#D4AF37]">
              {formatPrice(price.displayPrice, price.currency)}
            </span>

            {price.mrp && price.mrp > price.displayPrice && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(price.mrp, price.currency)}
              </span>
            )}

            {price.discountPct && price.discountPct > 0 && (
              <span className="text-xs font-bold text-green-400">
                {price.discountPct}% OFF
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
