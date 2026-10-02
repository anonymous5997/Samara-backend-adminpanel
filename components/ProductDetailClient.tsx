'use client';

import { useState } from 'react';
import {
  Heart,
  ShoppingCart,
  Check,
  Share2,
  Truck,
  ShieldCheck,
  Sparkles,
  Zap,
  Star,
} from 'lucide-react';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { ProductTryOnModal } from '@/components/ProductTryOnModal';
import { BuyNowModal } from '@/components/BuyNowModal';
import { SimilarProductsSection } from '@/components/SimilarProductsSection';
import { ProductReviewsSection } from '@/components/ProductReviewsSection';
import { WriteReviewModal } from '@/components/WriteReviewModal';
import { 
  formatPriceSync, 
  type SupportedCurrency 
} from '@/lib/currency-utils';
import { usePricePreview } from '@/lib/price-preview-context';

// INTERFACES
interface ProductPriceRow {
  currency_code: string; 
  price: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  base_price_inr: number;
  fabric?: string | null;
  occasion?: string | null;
  care_instructions?: string | null;
  shipping_time?: string | null;
  why_women_love?: string | null;
  product_prices?: ProductPriceRow[]; 
}

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

interface PriceData {
  displayPrice: number;
  currency: string;
  inrBase: number;
  mrp: number | null;
  discountPct: number | null;
}

interface ProductDetailClientProps {
  product: Product;
  images: ProductImage[];
  priceData: PriceData;
  similarProducts: any[];
  reviews: any[];
  isVerifiedBuyer: boolean;
  avgRating: number | null;
  reviewCount: number;
  // ✅ STEP 3: Add hasUserReviewed to interface
  hasUserReviewed: boolean;
}

export default function ProductDetailClient({
  product,
  images,
  priceData,
  similarProducts,
  reviews,
  isVerifiedBuyer,
  avgRating,
  reviewCount,
  // ✅ STEP 3: Destructure hasUserReviewed
  hasUserReviewed,
}: ProductDetailClientProps) {
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { preview } = usePricePreview(); 
  
  // STATE MANAGEMENT
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const [addingToCart, setAddingToCart] = useState(false);

  // Modals
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);
  const [buyNowModalOpen, setBuyNowModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(String(product.id), undefined, 1);
      toast.success('Added to bag');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to bag');
    } finally {
      setAddingToCart(false);
    }
  };

  // Shared Logic
  const handleShare = async () => {
    const shareData = {
      title: product.name,
      text: `Check out this ${product.name} on Samara`,
      url: window.location.href,
    };
  
    // Mobile: Native share sheet
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled share — do nothing
      }
      return;
    }
  
    // Desktop fallback
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    } catch {
      toast.error('Unable to share link');
    }
  };

  // Wishlist Logic
  const toggleWishlist = async () => {
    if (!user) {
      toast.error('Please login to save to wishlist');
      return;
    }
  
    const { data: existing } = await supabase
      .from('wishlist_items')
      .select('id')
      .eq('user_id', user.id)
      .eq('product_id', product.id)
      .maybeSingle();
  
    if (existing) {
      await supabase
        .from('wishlist_items')
        .delete()
        .eq('id', existing.id);
  
      toast.info('Removed from wishlist');
    } else {
      await supabase
        .from('wishlist_items')
        .insert({
          user_id: user.id,
          product_id: product.id,
        });
  
      toast.success('Added to wishlist');
    }
  };

  // =========================================================
  // PRICING LOGIC
  // =========================================================
  
  const previewCurrency = preview.currency as SupportedCurrency | undefined;
  const previewPrice = previewCurrency && product.product_prices
    ? product.product_prices.find((p: any) => 
        (p.currency_code === previewCurrency || p.currency === previewCurrency)
      )?.price
    : null;

  const currencyCode = previewCurrency || (priceData.currency as SupportedCurrency);
  const price = previewPrice ?? priceData.displayPrice;
  const mrp = priceData.mrp;
  const discount = priceData.discountPct || 0;

  const priceLabel = formatPriceSync(price, currencyCode);
  const mrpLabel = mrp ? formatPriceSync(mrp, currencyCode) : null;

  const canBuyNow = Boolean(
    price > 0 && 
    priceData.inrBase > 0
  );

  const selectedImage = images[selectedIndex]?.image_url || images[0]?.image_url || '';

  const highlights: string[] = [
    product.fabric ? `Fabric: ${product.fabric}` : '',
    product.occasion ? `Occasion: ${product.occasion}` : '',
    product.care_instructions ? `Care: ${product.care_instructions}` : '',
    product.shipping_time ? `Shipping: ${product.shipping_time}` : '',
    product.why_women_love || '',
  ].filter(Boolean) as string[];

  const finalHighlights = highlights.length ? highlights : ['Premium quality piece'];

  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <Toaster />
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* LEFT COLUMN: IMAGES */}
          <div className="lg:w-1/2 flex-shrink-0">
            <div className="sticky top-32 space-y-4">
              <div className="relative aspect-[3/4] bg-samara-void1 border border-samara-ivory/10 overflow-hidden">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-samara-ivory/40 font-sans text-sm tracking-widest uppercase">
                    No Image
                  </div>
                )}

                {finalHighlights.length > 0 && images.length > 1 && selectedIndex === 1 && (
                  <div className="pointer-events-none absolute inset-0 flex items-center bg-samara-void/80 px-6 md:px-10 py-10">
                    <div className="space-y-6">
                      <h3 className="font-serif text-2xl text-samara-gold">
                        The Details
                      </h3>
                      <ul className="space-y-4">
                        {finalHighlights.slice(0, 4).map((text, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <span className="mt-1 flex-shrink-0">
                              <Check className="h-3.5 w-3.5 text-samara-gold" />
                            </span>
                            <span className="text-sm font-sans text-samara-ivory/80 leading-relaxed">{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {images.length > 1 && (
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedIndex(index)}
                      className={`flex-shrink-0 w-24 h-32 overflow-hidden transition-all duration-300 ${
                        index === selectedIndex
                          ? 'border border-samara-gold opacity-100'
                          : 'border border-transparent opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={image.image_url}
                        alt={`${product.name} thumbnail`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: DETAILS */}
          <div className="lg:w-1/2 space-y-12">
            <div>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl text-samara-ivory mb-4 leading-tight">
                {product.name}
              </h1>
              
              {product.brand && (
                <p className="text-sm font-sans tracking-[0.2em] uppercase text-samara-ivory/60 mb-6">
                  {product.brand}
                </p>
              )}

              {/* Rating Display */}
              {avgRating !== null && (
                <div className="flex items-center gap-3">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i <= Math.round(avgRating)
                            ? 'text-samara-gold'
                            : 'text-samara-ivory/20'
                        }`}
                        fill={i <= Math.round(avgRating) ? 'currentColor' : 'none'}
                      />
                    ))}
                  </div>
                  <span className="text-xs font-sans tracking-widest text-samara-ivory/60">
                    ({reviewCount} reviews)
                  </span>
                </div>
              )}
            </div>

            {/* PRICE DISPLAY */}
            <div className="border-t border-b border-samara-ivory/10 py-8">
              <div className="flex items-center flex-wrap gap-4 mb-3">
                <span className="font-serif text-3xl md:text-4xl text-samara-gold">
                  {priceLabel}
                </span>
                
                {mrpLabel && discount > 0 && (
                  <span className="text-lg font-serif text-samara-ivory/40 line-through">
                    {mrpLabel}
                  </span>
                )}
                
                {discount > 0 && (
                  <span className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-void bg-samara-gold px-2 py-1">
                    {discount}% OFF
                  </span>
                )}
              </div>

              <p className="text-[10px] font-sans tracking-wide text-samara-ivory/40 uppercase">
                Inclusive of all taxes. Shipping calculated at checkout.
              </p>
            </div>

            {/* Description */}
            {product.description && (
              <div>
                <p className="text-sm md:text-base font-sans leading-relaxed text-samara-ivory/70">
                  {product.description}
                </p>
              </div>
            )}

            {/* ACTION BUTTONS */}
            <div className="space-y-4 pt-4">
              <button
                onClick={() => setBuyNowModalOpen(true)}
                disabled={!canBuyNow}
                className="w-full h-14 bg-samara-gold hover:bg-samara-goldDeep text-samara-void text-[11px] font-sans tracking-[0.2em] uppercase transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap className="h-4 w-4" />
                Buy Now
              </button>

              <div className="flex gap-4">
                <button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 h-14 border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold text-[11px] font-sans tracking-[0.2em] uppercase transition-colors flex items-center justify-center gap-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  {addingToCart ? 'Adding...' : 'Add to Bag'}
                </button>

                <button
                  onClick={toggleWishlist}
                  className="w-14 h-14 flex items-center justify-center border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold transition-colors"
                >
                  <Heart className="h-5 w-5 stroke-[1.5]" />
                </button>

                <button
                  onClick={handleShare}
                  className="w-14 h-14 flex items-center justify-center border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold transition-colors"
                >
                  <Share2 className="h-5 w-5 stroke-[1.5]" />
                </button>
              </div>
            </div>

            {/* Details Accordion style / Grid */}
            <div className="pt-8">
              <div className="grid grid-cols-2 gap-px bg-samara-ivory/10 border border-samara-ivory/10">
                <div className="bg-samara-void p-6 text-center">
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold mb-2">Fabric</p>
                  <p className="text-sm font-sans text-samara-ivory/80">
                    {product.fabric || '—'}
                  </p>
                </div>
                <div className="bg-samara-void p-6 text-center">
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold mb-2">Occasion</p>
                  <p className="text-sm font-sans text-samara-ivory/80">
                    {product.occasion || '—'}
                  </p>
                </div>
                <div className="bg-samara-void p-6 text-center">
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold mb-2">Wash Care</p>
                  <p className="text-sm font-sans text-samara-ivory/80">
                    {product.care_instructions || '—'}
                  </p>
                </div>
                <div className="bg-samara-void p-6 text-center">
                  <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-gold mb-2">Shipping</p>
                  <p className="text-sm font-sans text-samara-ivory/80">
                    {product.shipping_time || '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 pt-12 border-t border-samara-ivory/10">
              <div className="text-center group">
                <Truck className="h-6 w-6 text-samara-ivory/40 group-hover:text-samara-gold transition-colors mx-auto mb-3 stroke-[1.5]" />
                <p className="text-[10px] font-sans tracking-widest text-samara-ivory/60 uppercase">Free Shipping</p>
              </div>
              <div className="text-center group">
                <ShieldCheck className="h-6 w-6 text-samara-ivory/40 group-hover:text-samara-gold transition-colors mx-auto mb-3 stroke-[1.5]" />
                <p className="text-[10px] font-sans tracking-widest text-samara-ivory/60 uppercase">Authentic</p>
              </div>
              <div className="text-center group">
                <Sparkles className="h-6 w-6 text-samara-ivory/40 group-hover:text-samara-gold transition-colors mx-auto mb-3 stroke-[1.5]" />
                <p className="text-[10px] font-sans tracking-widest text-samara-ivory/60 uppercase">Handcrafted</p>
              </div>
            </div>

          </div>
        </div>

        {/* REVIEWS SECTION */}
        <div className="mt-32 pt-24 border-t border-samara-ivory/10">
          <div className="flex flex-col items-center justify-center text-center mb-16">
             <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
                Testimonials
             </span>
             <h2 className="font-serif text-4xl text-samara-ivory">
               Customer <em className="italic text-samara-gold">Reviews</em>
             </h2>
          </div>
          
          <ProductReviewsSection reviews={reviews} />

          <div className="flex flex-col items-center mt-12">
            {/* If NOT verified buyer */}
            {!isVerifiedBuyer && (
              <p className="text-xs font-sans tracking-widest uppercase text-samara-ivory/40">
                Only verified buyers can leave a review.
              </p>
            )}

            {/* Render Button only if Verified + Has NOT Reviewed */}
            {isVerifiedBuyer && !hasUserReviewed && (
              <button
                className="px-8 py-4 border border-samara-gold text-samara-gold text-[11px] font-sans tracking-[0.2em] uppercase hover:bg-samara-gold hover:text-samara-void transition-colors"
                onClick={() => setReviewModalOpen(true)}
              >
                Write a Review
              </button>
            )}

            {/* Show message if already reviewed */}
            {hasUserReviewed && (
              <p className="text-xs font-sans tracking-widest uppercase text-samara-ivory/40">
                You’ve already reviewed this piece.
              </p>
            )}
          </div>
        </div>

        {/* Similar Products */}
        <div className="mt-32 pt-24 border-t border-samara-ivory/10">
          <div className="flex flex-col items-center justify-center text-center mb-16">
             <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
                More to Explore
             </span>
             <h2 className="font-serif text-4xl text-samara-ivory">
               Similar <em className="italic text-samara-gold">Pieces</em>
             </h2>
          </div>
          <SimilarProductsSection products={similarProducts} />
        </div>
      </div>

      {/* MODALS */}
      <ProductTryOnModal
        isOpen={tryOnModalOpen}
        onClose={() => setTryOnModalOpen(false)}
        productImage={selectedImage}
        productName={product.name}
      />
      
      <BuyNowModal
        isOpen={buyNowModalOpen}
        onClose={() => setBuyNowModalOpen(false)}
        productId={product.id}
        productName={product.name}
        productPrice={price}
        currency={currencyCode}
        productPriceInr={priceData.inrBase || product.base_price_inr}
        productImage={selectedImage}
      />

      <WriteReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        productId={product.id}
      />
    </div>
  );
}