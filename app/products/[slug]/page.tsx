'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase/client';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Heart, ShoppingCart, Check, Share2, Truck, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  brand: string;
  base_price_inr: number;
  is_active: boolean;
}

interface ProductImage {
  id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export default function ProductDetailPageLuxury() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [slug]);

  const fetchProduct = async () => {
    try {
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

      if (!productData) {
        setLoading(false);
        return;
      }

      const { data: imageData } = await supabase
        .from('product_images')
        .select('*')
        .eq('product_id', productData.id)
        .order('display_order');

      setProduct(productData);
      setImages(imageData || []);

      const primaryImage = imageData?.find(img => img.is_primary)?.image_url || imageData?.[0]?.image_url || '';
      setSelectedImage(primaryImage);
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(String(product.id), undefined, 1);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="bg-black text-white min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="font-serif text-3xl font-bold text-gold mb-4">Product Not Found</h2>
          <Link href="/sarees" className="text-gold hover:underline">
            Browse All Sarees
          </Link>
        </div>
      </div>
    );
  }

  const mrp = Math.round(product.base_price_inr * 1.15);
  const discount = Math.round(((mrp - product.base_price_inr) / mrp) * 100);

  return (
    <div className="bg-black text-white min-h-screen">
      <Toaster />

      <section className="py-12 bg-gradient-to-b from-black to-luxury-charcoal">
        <div className="container mx-auto px-4 md:px-8">
          <div className="grid md:grid-cols-2 gap-12 max-w-7xl mx-auto">
            <div>
              <div className="sticky top-24">
                <div className="aspect-[3/4] bg-luxury-charcoal rounded-lg border-2 border-gold/20 overflow-hidden mb-4 shadow-2xl shadow-gold/10">
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
                </div>

                {images.length > 1 && (
                  <div className="flex gap-3 overflow-x-auto pb-2">
                    {images.map((image) => (
                      <button
                        key={image.id}
                        onClick={() => setSelectedImage(image.image_url)}
                        className={`flex-shrink-0 w-20 h-20 rounded border-2 overflow-hidden transition-all ${
                          selectedImage === image.image_url
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

            <div className="space-y-6">
              <div>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-gold mb-3 tracking-tighter">
                  {product.name}
                </h1>
                {product.brand && (
                  <p className="text-gray-400 text-lg mb-6">by {product.brand}</p>
                )}
              </div>

              <div className="border-t border-b border-gold/20 py-6">
                <div className="flex items-baseline gap-4 mb-2">
                  <span className="font-serif text-4xl font-bold text-gold">
                    ₹{product.base_price_inr.toLocaleString('en-IN')}
                  </span>
                  <span className="text-xl text-gray-500 line-through">
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                  <span className="bg-gold text-black px-3 py-1 rounded-full text-sm font-bold">
                    {discount}% OFF
                  </span>
                </div>
                <p className="text-sm text-gray-500">Inclusive of all taxes</p>
              </div>

              {product.description && (
                <div>
                  <h3 className="font-serif text-xl font-semibold text-gold mb-3">Description</h3>
                  <p className="text-gray-400 leading-relaxed">{product.description}</p>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="font-serif text-xl font-semibold text-gold">Product Details</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Fabric</p>
                    <p className="text-white font-medium">Pure Silk</p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Occasion</p>
                    <p className="text-white font-medium">Festive</p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Wash Care</p>
                    <p className="text-white font-medium">Dry Clean Only</p>
                  </div>
                  <div className="bg-luxury-charcoal p-4 rounded border border-gold/10">
                    <p className="text-gray-500 mb-1">Shipping</p>
                    <p className="text-white font-medium">3-5 Days</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                  className="flex-1 bg-gold-gradient hover:shadow-xl hover:shadow-gold/40 text-black font-semibold py-6 text-lg"
                >
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  {addingToCart ? 'Adding...' : 'Add to Bag'}
                </Button>

                {user && (
                  <Button
                    variant="outline"
                    className="border-2 border-gold text-gold hover:bg-gold/10 py-6"
                    size="icon"
                  >
                    <Heart className="h-5 w-5" />
                  </Button>
                )}

                <Button
                  variant="outline"
                  className="border-2 border-gold text-gold hover:bg-gold/10 py-6"
                  size="icon"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              </div>

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

          <div className="max-w-7xl mx-auto mt-20 pt-12 border-t border-gold/20">
            <div className="bg-luxury-charcoal rounded-lg p-8 border border-gold/20">
              <h3 className="font-serif text-2xl font-bold text-gold mb-6 text-center">
                Why Women Love This Saree
              </h3>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  'Handwoven by master artisans',
                  'Premium quality materials',
                  'Perfect for special occasions',
                ].map((reason, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-gold/20 flex items-center justify-center flex-shrink-0 mt-1">
                      <Check className="h-4 w-4 text-gold" />
                    </div>
                    <p className="text-gray-400">{reason}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
