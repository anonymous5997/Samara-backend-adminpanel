'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Product, ProductImage } from '@/lib/types';
import { formatPriceSync } from '@/lib/currency-utils';
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
    <Link
      href={`/products/${product.slug}`}
      className="group block border border-[#D4AF37]/30 hover:border-[#D4AF37] rounded-xl p-3 transition bg-black"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[3/4] overflow-hidden rounded-xl bg-[#111]">
        {image ? (
          <Image
            src={image.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            No Image
          </div>
        )}

        {/* Wishlist Button */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full h-8 w-8"
            onClick={toggleWishlist}
            disabled={loading}
          >
            <Heart
              className={`h-4 w-4 ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-white'
              }`}
            />
          </Button>
        )}
      </div>

      {/* DETAILS SECTION */}
      <div className="mt-3 space-y-1">
        {/* Title */}
        <h3 className="text-base font-serif font-semibold text-[#D4AF37] line-clamp-2 leading-tight group-hover:text-[#F4CF57] transition-colors">
          {product.name}
        </h3>

        {/* Brand */}
        <p className="text-xs text-gray-400 font-medium">
          {product.brand || 'Samara Heritage'}
        </p>

        {/* PRICE */}
        {!price ? (
          <div className="mt-2 h-5 w-24 bg-gray-800 animate-pulse rounded" />
        ) : (
          <div className="mt-2 flex items-center gap-2">
            {/* Selling Price */}
            <span className="text-base font-semibold text-[#D4AF37]">
              {formatPriceSync(price.displayPrice, price.currency)}
            </span>

            {/* MRP */}
            {price.mrp && price.mrp > price.displayPrice && (
              <span className="text-xs text-gray-500 line-through decoration-gray-600">
                {formatPriceSync(price.mrp, price.currency)}
              </span>
            )}

            {/* Discount */}
            {price.discountPct && price.discountPct > 0 && (
              <span className="text-[10px] font-bold text-green-400 border border-green-400/30 px-1.5 py-0.5 rounded bg-green-400/10">
                {price.discountPct}% OFF
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
