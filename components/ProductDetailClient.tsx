'use client';

import { useRef, useState } from 'react';
import Link from 'next/link';
import {
  Heart,
  Loader2,
  Share2,
  Star,
} from 'lucide-react';
import { toast } from 'sonner';
import { useShell } from '@/components/shell/ShellProvider';
import { Reveal } from '@/components/motion/Reveal';
import { ProductGallery } from '@/components/pdp/ProductGallery';
import { ProductDetailsAccordion } from '@/components/pdp/ProductDetailsAccordion';
import { MobileBuyBar } from '@/components/pdp/MobileBuyBar';
import { StickyColumn } from '@/components/pdp/StickyColumn';
import { circleBtn, goldBtn, isGalleryImage } from '@/components/pdp/pdp-utils';
import { cn } from '@/lib/utils';
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
  // Presentation-only fields (already in the `select *` row)
  work?: string | null;
  color?: string | null;
  is_handcrafted?: boolean | null;
  is_perfect_for_special_occasions?: boolean | null;
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
  images: allImages,
  priceData,
  similarProducts,
  reviews,
  isVerifiedBuyer,
  avgRating,
  reviewCount,
  // ✅ STEP 3: Destructure hasUserReviewed
  hasUserReviewed,
}: ProductDetailClientProps) {
  // Presentation filter: stock placeholder.com rows are not product photos.
  const images = allImages.filter((img) => isGalleryImage(img.image_url));

  const { user } = useAuth();
  const { addToCart } = useCart();
  const { openCart } = useShell();
  const { preview } = usePricePreview(); 
  
  // STATE MANAGEMENT
  const [selectedIndex, setSelectedIndex] = useState(0); 
  const [addingToCart, setAddingToCart] = useState(false);

  // Modals
  const [tryOnModalOpen, setTryOnModalOpen] = useState(false);
  const [buyNowModalOpen, setBuyNowModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  // Presentation: the mobile buy bar watches these.
  const ctaRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addToCart(String(product.id), undefined, 1);
      toast.success('Added to cart');
      openCart();
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

  const finalHighlights = highlights.length ? highlights : ['Premium quality saree'];

  // Presentation-only derived labels
  const metaLine = [product.fabric, product.color, product.occasion].filter(Boolean).join(' · ');
  const flags = [
    product.is_handcrafted ? 'Handcrafted' : '',
    product.is_perfect_for_special_occasions ? 'Perfect for special occasions' : '',
  ].filter(Boolean);
  const showMrp = Boolean(mrpLabel && discount > 0);
  const roundedRating = avgRating !== null ? Math.round(avgRating) : 0;

  return (
    <div className="bg-samara-black text-samara-ivory">
      {/* PRODUCT */}
      <section className="sm-container pb-16 pt-0 lg:pb-24 lg:pt-10">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-14 xl:gap-20">
          {/* LEFT: GALLERY */}
          <div className="min-w-0">
            <ProductGallery
              images={images}
              productName={product.name}
              selectedIndex={selectedIndex}
              onSelect={setSelectedIndex}
              highlights={finalHighlights}
            />
          </div>

          {/* RIGHT: DETAILS */}
          <div className="min-w-0">
            <StickyColumn className="lg:top-[calc(var(--sm-header-h)+2.5rem)]">
              <nav aria-label="Breadcrumb">
                <ol className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-mute">
                  <li>
                    <Link href="/" className="transition-colors hover:text-samara-ivory">Home</Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li>
                    <Link href="/sarees" className="transition-colors hover:text-samara-ivory">Sarees</Link>
                  </li>
                  <li aria-hidden>/</li>
                  <li aria-current="page" className="min-w-0 truncate text-samara-ivory/80">{product.name}</li>
                </ol>
              </nav>

              <h1 className="mt-6 font-serif text-[2.5rem] font-light leading-[1.02] tracking-[-0.01em] text-samara-ivory [text-wrap:balance] sm:text-[3rem] xl:text-[3.5rem]">
                {product.name}
              </h1>

              {product.brand && (
                <p className="mt-3 font-serif text-lg font-light italic text-samara-gold">
                  by {product.brand}
                </p>
              )}

              {metaLine && (
                <p className="mt-5 font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">
                  {metaLine}
                </p>
              )}

              {/* Rating Display */}
              {avgRating !== null && (
                <a href="#reviews" className="mt-3 inline-flex min-h-[44px] items-center gap-3 font-sans text-[0.75rem] text-samara-mute transition-colors hover:text-samara-ivory">
                  <span className="flex gap-0.5" aria-hidden>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Star
                        key={i}
                        className={cn('h-3.5 w-3.5', i <= roundedRating ? 'text-samara-gold' : 'text-samara-mute/50')}
                        fill={i <= roundedRating ? 'currentColor' : 'none'}
                        strokeWidth={1.25}
                      />
                    ))}
                  </span>
                  <span className="tabular-nums">
                    {avgRating.toFixed(1)} ({reviewCount} reviews)
                  </span>
                </a>
              )}

              {/* PRICE DISPLAY */}
              <div className="mt-6">
                {flags.length > 0 && (
                  <p className="mb-3 font-sans text-[0.625rem] font-medium uppercase tracking-[0.24em] text-samara-gold">
                    {flags.join(' · ')}
                  </p>
                )}
                <p className="flex flex-wrap items-baseline gap-x-3 font-sans tabular-nums">
                  <span className="text-[1.5rem] font-normal text-samara-ivory">{priceLabel}</span>
                  {showMrp && (
                    <s className="text-[0.9375rem] text-samara-mute">
                      <span className="sr-only">MRP </span>
                      {mrpLabel}
                    </s>
                  )}
                </p>

                {/* Mandatory Price Disclaimer */}
                <p className="mt-3 max-w-md font-sans text-[0.75rem] leading-relaxed text-samara-mute">
                  Price includes applicable taxes. Shipping charges, import duties,
                  and international taxes may vary based on delivery location and
                  will be calculated at checkout.
                </p>
              </div>

              <div className="sm-hairline my-7" />

              {/* ACTION BUTTONS */}
              <div ref={ctaRef} className="space-y-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className={cn(goldBtn, 'w-full')}
                >
                  {addingToCart && <Loader2 aria-hidden className="h-4 w-4 animate-spin motion-reduce:animate-none" strokeWidth={1.5} />}
                  {addingToCart ? 'Adding...' : 'Add to Bag'}
                </button>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setBuyNowModalOpen(true)}
                    disabled={!canBuyNow}
                    className="sm-btn sm-btn-ghost min-w-0 flex-1 px-4"
                  >
                    Buy Now
                  </button>

                  <button
                    type="button"
                    className={circleBtn}
                    onClick={toggleWishlist}
                    aria-label="Save to wishlist"
                  >
                    <Heart aria-hidden className="h-4 w-4" strokeWidth={1.25} />
                  </button>

                  <button
                    type="button"
                    className={circleBtn}
                    onClick={handleShare}
                    aria-label="Share this product"
                  >
                    <Share2 aria-hidden className="h-4 w-4" strokeWidth={1.25} />
                  </button>
                </div>
              </div>

              {/* Trust Badges */}
              <ul className="mt-7 grid grid-cols-3 border-y border-samara-line">
                {['Free Shipping', 'Authentic', 'Handcrafted'].map((label, i) => (
                  <li
                    key={label}
                    className={cn(
                      'py-4 text-center font-sans text-[0.625rem] font-medium uppercase tracking-[0.2em] text-samara-mute',
                      i > 0 && 'border-l border-samara-line',
                    )}
                  >
                    {label}
                  </li>
                ))}
              </ul>

              {/* Details */}
              <div className="mt-8">
                <ProductDetailsAccordion
                  description={product.description}
                  fabric={product.fabric}
                  work={product.work}
                  occasion={product.occasion}
                  careInstructions={product.care_instructions}
                  shippingTime={product.shipping_time}
                  whyWomenLove={product.why_women_love}
                />
              </div>
            </StickyColumn>
          </div>
        </div>
      </section>

      {/* REVIEWS SECTION */}
      <section id="reviews" aria-labelledby="reviews-title" className="scroll-mt-[var(--sm-header-h)] border-t border-samara-line bg-samara-forest">
        <div className="sm-container grid gap-10 py-16 sm:py-20 lg:grid-cols-[minmax(14rem,22rem)_1fr] lg:gap-16 lg:py-24 xl:gap-24">
          <Reveal>
            <p className="sm-eyebrow">Reviews</p>
            <h2 id="reviews-title" className="mt-4 font-serif text-[2.25rem] font-light leading-[1.02] text-samara-ivory sm:text-[2.75rem]">
              Customer <span className="sm-accent">Reviews</span>
            </h2>

            {avgRating !== null && (
              <p className="mt-6 flex items-baseline gap-3 font-sans tabular-nums">
                <span className="font-serif text-[2.5rem] font-light leading-none text-samara-ivory">{avgRating.toFixed(1)}</span>
                <span className="text-[0.6875rem] uppercase tracking-[0.18em] text-samara-mute">
                  out of 5 · {reviewCount} reviews
                </span>
              </p>
            )}

            <div className="mt-8">
              {/* If NOT verified buyer */}
              {!isVerifiedBuyer && (
                <p className="font-sans text-[0.8125rem] italic text-samara-mute">
                  Only verified buyers can leave a review.
                </p>
              )}

              {/* ✅ STEP 4: Render Button only if Verified + Has NOT Reviewed */}
              {isVerifiedBuyer && !hasUserReviewed && (
                <button
                  type="button"
                  className="sm-btn sm-btn-ghost"
                  onClick={() => setReviewModalOpen(true)}
                >
                  Write a Review
                </button>
              )}

              {/* ✅ STEP 4: Show message if already reviewed */}
              {hasUserReviewed && (
                <p className="mt-4 font-sans text-[0.8125rem] italic text-samara-mute">
                  You’ve already reviewed this product.
                </p>
              )}
            </div>
          </Reveal>

          <ProductReviewsSection reviews={reviews} />
        </div>
      </section>

      {/* Similar Products */}
      <SimilarProductsSection products={similarProducts} />

      {/* End of product content — the mobile bar hides from here on. */}
      <div ref={endRef} aria-hidden className="h-px" />

      <MobileBuyBar
        productName={product.name}
        priceLabel={priceLabel}
        mrpLabel={showMrp ? mrpLabel : null}
        adding={addingToCart}
        onAdd={handleAddToCart}
        ctaRef={ctaRef}
        endRef={endRef}
      />

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
