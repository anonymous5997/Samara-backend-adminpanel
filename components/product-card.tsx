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
  image?: Partial<ProductImage> & { image_url: string; is_primary: boolean };
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
      className="group block"
    >
      {/* IMAGE CONTAINER */}
      <div className="relative aspect-[3/4] overflow-hidden bg-samara-void1">
        {image ? (
          <Image
            src={image.image_url}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-samara-ivory/20 font-serif">
            No Image
          </div>
        )}

        {/* Wishlist Button */}
        {user && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 bg-samara-void/50 backdrop-blur-sm hover:bg-samara-gold hover:text-samara-void border border-samara-ivory/20 rounded-full h-9 w-9 opacity-0 group-hover:opacity-100 transition-all duration-300"
            onClick={toggleWishlist}
            disabled={loading}
          >
            <Heart
              className={`h-4 w-4 stroke-[1.5] ${
                isWishlisted ? 'fill-red-500 text-red-500' : 'text-samara-ivory'
              }`}
            />
          </Button>
        )}

        {/* Quick View overlay */}
        <div className="absolute inset-x-0 bottom-0 h-12 flex items-center justify-center bg-samara-void/70 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-full group-hover:translate-y-0">
          <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory">Quick View</span>
        </div>
      </div>

      {/* DETAILS SECTION */}
      <div className="pt-4 space-y-2">
        {/* Title */}
        <h3 className="text-base font-serif text-samara-ivory line-clamp-1 leading-tight group-hover:text-samara-gold transition-colors duration-300">
          {product.name}
        </h3>

        {/* Brand */}
        <p className="text-[11px] font-sans tracking-wider uppercase text-samara-ivory/40">
          {product.brand || 'Samara'}
        </p>

        {/* PRICE */}
        {!price ? (
          <div className="h-5 w-24 bg-samara-void1 animate-pulse" />
        ) : (
          <div className="flex items-center gap-3">
            {/* Selling Price */}
            <span className="text-sm font-sans tracking-wide text-samara-gold">
              {formatPriceSync(price.displayPrice, price.currency)}
            </span>

            {/* MRP */}
            {price.mrp && price.mrp > price.displayPrice && (
              <span className="text-xs text-samara-ivory/40 line-through">
                {formatPriceSync(price.mrp, price.currency)}
              </span>
            )}

            {/* Discount */}
            {price.discountPct && price.discountPct > 0 && (
              <span className="text-[10px] font-sans tracking-wider text-green-400 bg-green-400/10 px-2 py-0.5">
                {price.discountPct}% OFF
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}
