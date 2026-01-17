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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { ProductTryOnModal } from '@/components/ProductTryOnModal';
import { BuyNowModal } from '@/components/BuyNowModal';
import { SimilarProductsSection } from '@/components/SimilarProductsSection';
import { 
  formatPriceSync, 
  type SupportedCurrency 
} from '@/lib/currency-utils';
import { usePricePreview } from '@/lib/price-preview-context';

// INTERFACES

// Update to match DB response for instant lookup
interface ProductPriceRow {
  currency_code: string; // Standard Supabase/SQL naming
  price: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  base_price_inr: number;
  // Extra fields
  fabric?: string | null;
  occasion?: string | null;
  care_instructions?: string | null;
  shipping_time?: string | null;
  why_women_love?: string | null;
  // Available raw prices for client-side preview lookup
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
}

export default function ProductDetailClient({
  product,
  images,
  priceData,
  similarProducts,
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

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(String(product.id), undefined, 1);
      toast.success('Added to cart');
    } catch (err) {
      console.error(err);
      toast.error('Failed to add to bag');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  // =========================================================
  // ✅ PRICING LOGIC - CLIENT SIDE INSTANT LOOKUP
  // =========================================================
  
  const previewCurrency = preview.currency as SupportedCurrency | undefined;

  // Look up admin-defined price for preview immediately from raw data
  const previewPrice = previewCurrency && product.product_prices
    ? product.product_prices.find((p: any) => 
        // Check both common patterns (currency_code or currency)
        (p.currency_code === previewCurrency || p.currency === previewCurrency)
      )?.price
    : null;

  // Final values
  const currencyCode = previewCurrency || (priceData.currency as SupportedCurrency);
  
  // If we found a specific price, use it. Otherwise, fallback to server value.
  const price = previewPrice ?? priceData.displayPrice;
  
  const mrp = priceData.mrp;
  const discount = priceData.discountPct || 0;

  // Format Labels
  const priceLabel = formatPriceSync(price, currencyCode);
  const mrpLabel = mrp ? formatPriceSync(mrp, currencyCode) : null;

  // =========================================================
  // ✅ BUY NOW GUARD
  // =========================================================
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

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster />

      <section className="py-12 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            
            {/* -----------------------------------------------------------
                LEFT COLUMN: IMAGES
               ----------------------------------------------------------- */}
            <div>
              <div className="sticky top-24 space-y-4">
                <div className="relative aspect-[3/4] bg-luxury-charcoal rounded-lg border-2 border-gold/20 overflow-hidden shadow-2xl shadow-gold/10">
                  {selectedImage ? (
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600 font-serif">
                      Product Image
                    </div>
                  )}

                  {/* Highlights Overlay (Index 1) */}
                  {finalHighlights.length > 0 && images.length > 1 && selectedIndex === 1 && (
                    <div className="pointer-events-none absolute inset-0 flex items-center bg-gradient-to-r from-black/80 via-black/50 to-transparent px-4 sm:px-8 py-6 sm:py-10">
                      <div className="max-w-xs space-y-4 text-left">
                        <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                          Key Highlights
                        </h3>
                        <ul className="space-y-3 text-xs sm:text-sm">
                          {finalHighlights.slice(0, 4).map((text, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-gray-100">
                              <span className="mt-0.5 sm:mt-1">
                                <Check className="h-4 w-4 text-gold" />
                              </span>
                              <span>{text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((image, index) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedIndex(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                          index === selectedIndex
                            ? 'border-gold shadow-lg shadow-gold/30'
                            : 'border-gold/20 hover:border-gold/50'
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

            {/* -----------------------------------------------------------
                RIGHT COLUMN: DETAILS
               ----------------------------------------------------------- */}
            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold mb-3 tracking-tighter">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="text-gray-400 text-lg mb-6">
                    by {product.brand}
                  </p>
                )}
              </div>

              {/* PRICE DISPLAY */}
              <div className="border-t border-b border-gold/20 py-6">
                <div className="flex items-baseline gap-4 mb-2">
                  {/* Selling Price (Resolved) */}
                  <span className="font-serif text-4xl font-bold text-gold">
                    {priceLabel}
                  </span>
                  
                  {/* MRP */}
                  {mrpLabel && discount > 0 && (
                    <span className="text-xl text-gray-500 line-through">
                      {mrpLabel}
                    </span>
                  )}
                  
                  {/* Discount Badge */}
                  {discount > 0 && (
                    <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-bold">
                      {discount}% OFF
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  Inclusive of all taxes
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-gold mb-3">
                    Description
                  </h3>
                  <p className="text-gray-400 leading-relaxed">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Details Grid */}
              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-gold">
                  Product Details
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Fabric</p>
                    <p className="text-white font-medium">
                      {product.fabric || '—'}
                    </p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Occasion</p>
                    <p className="text-white font-medium">
                      {product.occasion || '—'}
                    </p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Wash Care</p>
                    <p className="text-white font-medium">
                      {product.care_instructions || '—'}
                    </p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Shipping</p>
                    <p className="text-white font-medium">
                      {product.shipping_time || '—'}
                    </p>
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="space-y-3 pt-4">
                <Button
                  onClick={() => setBuyNowModalOpen(true)}
                  disabled={!canBuyNow}
                  className="w-full bg-gradient-to-r from-[#D4AF37] via-[#F4D03F] to-[#D4AF37] hover:shadow-2xl hover:shadow-[#D4AF37]/60 text-black font-bold py-7 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Buy Now
                </Button>

                <div className="flex gap-3">
                  <Button
                    onClick={handleAddToCart}
                    disabled={addingToCart}
                    variant="outline"
                    className="flex-1 border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 font-semibold py-6 text-lg"
                  >
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    {addingToCart ? 'Adding...' : 'Add to Bag'}
                  </Button>

                  {/* Wishlist */}
                  {user && (
                    <Button
                      variant="outline"
                      className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 py-6"
                      size="icon"
                    >
                      <Heart className="h-5 w-5" />
                    </Button>
                  )}

                  {/* Share */}
                  <Button
                    variant="outline"
                    className="border-2 border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 py-6"
                    size="icon"
                    onClick={handleShare}
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gold/20">
                <div className="text-center">
                  <Truck className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Free Shipping</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Authentic</p>
                </div>
                <div className="text-center">
                  <Sparkles className="h-6 w-6 text-gold mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Handcrafted</p>
                </div>
              </div>
            </div>
          </div>

          {/* Similar Products */}
          <div className="max-w-7xl mx-auto mt-20 pt-12 border-t border-[#D4AF37]/20">
            <SimilarProductsSection products={similarProducts} />
          </div>
        </div>
      </section>

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
        
        // DISPLAY PRICE (what user sees - dynamic)
        productPrice={price}
        currency={currencyCode}

        // PAYMENT PRICE (what Razorpay needs - static INR base)
        productPriceInr={priceData.inrBase || product.base_price_inr}

        productImage={selectedImage}
      />
    </div>
  );
}