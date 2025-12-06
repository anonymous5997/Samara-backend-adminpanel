'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { CurrencySelector } from '@/components/currency-selector';
import { supabase } from '@/lib/supabase/client';
import { ProductWithDetails, ProductVariant, Currency } from '@/lib/types';
import { formatPrice } from '@/lib/currency';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth-context';
import { Camera, Heart, ShoppingCart, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { user } = useAuth();
  const { addToCart, currency, setCurrency } = useCart();
  const [product, setProduct] = useState<ProductWithDetails | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [showTryOn, setShowTryOn] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [currencyRate, setCurrencyRate] = useState(1);

  useEffect(() => {
    fetchProduct();
    fetchCurrencyRate();
  }, [slug]);

  useEffect(() => {
    fetchCurrencyRate();
  }, [currency]);

  const fetchCurrencyRate = async () => {
    const { data } = await supabase
      .from('currency_rates')
      .select('rate')
      .eq('target_currency', currency)
      .maybeSingle();

    if (data) {
      setCurrencyRate(data.rate);
    }
  };

  const fetchProduct = async () => {
    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();

    if (!productData) {
      setLoading(false);
      return;
    }

    const { data: variants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', productData.id);

    const { data: images } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productData.id)
      .order('display_order');

    const { data: category } = await supabase
      .from('categories')
      .select('*')
      .eq('id', productData.category_id)
      .maybeSingle();

    const productWithDetails: ProductWithDetails = {
      ...productData,
      variants: variants || [],
      images: images || [],
      category: category || undefined,
    };

    setProduct(productWithDetails);
    if (images && images.length > 0) {
      setSelectedImage(images[0].image_url);
    }
    if (variants && variants.length > 0) {
      setSelectedVariant(variants[0]);
    }
    setLoading(false);
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please sign in to add items to cart');
      return;
    }

    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, selectedVariant?.id);
      toast.success('Added to cart');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      const video = document.getElementById('camera-video') as HTMLVideoElement;
      if (video) {
        video.srcObject = stream;
      }
    } catch (error) {
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
  };

  const handleTryOn = () => {
    setShowTryOn(true);
    setTimeout(() => startCamera(), 100);
  };

  const closeTryOn = () => {
    stopCamera();
    setShowTryOn(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Product not found</div>
      </div>
    );
  }

  const price = product.base_price_inr + (selectedVariant?.additional_price_inr || 0);

  return (
    <>
      <Toaster />
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-4">
              {selectedImage ? (
                <Image
                  src={selectedImage}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No Image
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setSelectedImage(image.image_url)}
                    className={`aspect-square relative rounded-lg overflow-hidden border-2 ${
                      selectedImage === image.image_url
                        ? 'border-gray-900'
                        : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image.image_url}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="mb-4">
              <CurrencySelector currency={currency} onChange={setCurrency} />
            </div>

            {product.brand && (
              <p className="text-sm text-gray-600 mb-2">{product.brand}</p>
            )}
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-2xl font-semibold mb-6">
              {formatPrice(price, currency, currencyRate)}
            </p>

            {product.description && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600">{product.description}</p>
              </div>
            )}

            {product.variants.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Select Size</h3>
                <div className="flex gap-2">
                  {product.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={variant.stock === 0}
                      className={`px-4 py-2 border-2 rounded-md transition-colors ${
                        selectedVariant?.id === variant.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : variant.stock === 0
                          ? 'border-gray-200 text-gray-400 cursor-not-allowed'
                          : 'border-gray-300 hover:border-gray-900'
                      }`}
                    >
                      {variant.size || variant.color}
                      {variant.stock === 0 && (
                        <span className="block text-xs">Out of Stock</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedVariant && selectedVariant.stock > 0 && (
              <p className="text-sm text-green-600 mb-4">
                <Check className="inline h-4 w-4 mr-1" />
                In Stock ({selectedVariant.stock} available)
              </p>
            )}

            <div className="flex gap-4 mb-6">
              <Button
                size="lg"
                className="flex-1"
                onClick={handleAddToCart}
                disabled={addingToCart || !selectedVariant || selectedVariant.stock === 0}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                Add to Cart
              </Button>
              {user && (
                <Button size="lg" variant="outline">
                  <Heart className="h-5 w-5" />
                </Button>
              )}
            </div>

            <Button
              size="lg"
              variant="secondary"
              className="w-full"
              onClick={handleTryOn}
            >
              <Camera className="mr-2 h-5 w-5" />
              Try with Camera
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showTryOn} onOpenChange={closeTryOn}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>AI Virtual Try-On</DialogTitle>
            <DialogDescription>
              See how this product looks on you
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden">
            <video
              id="camera-video"
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {selectedImage && (
              <div className="absolute top-4 right-4 w-48 h-48 opacity-50">
                <Image
                  src={selectedImage}
                  alt="Product overlay"
                  fill
                  className="object-contain"
                />
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 text-center">
            This is an MVP feature. The product image is overlaid on your camera feed.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
