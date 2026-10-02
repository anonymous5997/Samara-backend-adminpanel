'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { Dialog, DialogDescription, DialogOverlay, DialogPortal, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPriceSync } from '@/lib/currency-utils';
import type { SupportedCurrency } from '@/lib/currency-utils';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  productId: string;
  productName: string;

  // ✅ DISPLAY PRICE (What the user sees)
  productPrice: number;
  currency: SupportedCurrency;  

  // ✅ PAYMENT PRICE (What Razorpay charges)
  productPriceInr: number; 

  productImage?: string | null;
}

export function BuyNowModal({
  isOpen,
  onClose,
  productId,
  productName,
  productPrice,
  productPriceInr,
  currency,
  productImage,
}: BuyNowModalProps) {
  const { user } = useAuth();
  const router = useRouter();

  const handleBuyNow = () => {
    if (!user) {
      toast.error('Please login to continue');
      router.push('/auth/login');
      return;
    }

    // ✅ FIX: Save with the keys the Checkout page expects
    // The Checkout page looks for 'unit_price', 'currency', and 'unit_price_inr'
    sessionStorage.setItem(
      'buynow_product',
      JSON.stringify({
        productId,
        productName,

        // DISPLAY DATA
        unit_price: productPrice,
        currency,

        // PAYMENT DATA (Critical for Razorpay)
        unit_price_inr: productPriceInr,
 

        image: productImage || null,
        quantity: 1,
      })
    );

    onClose();
    router.push('/checkout?mode=buynow');
  };


  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogPortal>
        <DialogOverlay className="sm-drawer-overlay z-[1100] bg-black/60 backdrop-blur-[2px]" />
        <DialogPrimitive.Content className="storefront fixed left-1/2 top-1/2 z-[1101] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 border border-samara-line bg-samara-ink p-6 text-samara-ivory outline-none sm:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="sm-eyebrow">Buy Now</p>
              <DialogTitle className="mt-3 font-serif text-[2rem] font-light leading-none tracking-normal text-samara-ivory">
                Confirm <span className="sm-accent">Purchase</span>
              </DialogTitle>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 -mt-2 flex h-11 w-11 shrink-0 items-center justify-center text-samara-mute transition-colors hover:text-samara-ivory focus-visible:outline focus-visible:outline-1 focus-visible:outline-samara-gold"
            >
              <X aria-hidden className="h-4 w-4" strokeWidth={1.25} />
            </button>
          </div>

          <div className="mb-8 mt-6 space-y-5">
            <DialogDescription className="font-sans text-[0.875rem] leading-relaxed text-samara-mute">
              You are about to purchase <strong className="font-medium text-samara-ivory">{productName}</strong>.
            </DialogDescription>

            <div className="flex items-baseline justify-between border-y border-samara-line py-4">
              <span className="font-sans text-[0.6875rem] uppercase tracking-[0.2em] text-samara-mute">Total:</span>
              <span className="font-sans text-[1.25rem] tabular-nums text-samara-ivory">
                {formatPriceSync(productPrice, currency)}
              </span>
            </div>

            <p className="font-sans text-[0.75rem] text-samara-mute">
              You will be redirected to checkout to complete your purchase.
            </p>
          </div>

          <button
            type="button"
            className="sm-btn w-full bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory"
            onClick={handleBuyNow}
          >
            Continue to Checkout
          </button>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
