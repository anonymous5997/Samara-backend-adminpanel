'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatPriceSync } from '@/lib/currency-utils';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  
  productId: string;
  productName: string;

  // ✅ DISPLAY PRICE (What the user sees)
  productPrice: number;
  currency: string;

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
        currency , 

        image: productImage || null,
        quantity: 1,
      })
    );

    onClose();
    router.push('/checkout?mode=buynow');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md bg-black border-2 border-[#D4AF37] text-white">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif text-2xl text-[#D4AF37]">
            Confirm Purchase
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="hover:text-[#D4AF37]">
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-gray-300">
            You are about to purchase <strong>{productName}</strong>.
          </p>
          
          <div className="bg-[#1a1a1a] p-3 rounded border border-gray-800 flex justify-between items-center">
            <span className="text-gray-400 text-sm">Total:</span>
            <span className="text-[#D4AF37] font-bold text-lg">
              {formatPriceSync(productPrice, currency)}
            </span>
          </div>

          <p className="text-xs text-gray-500">
            You will be redirected to checkout to complete your purchase.
          </p>
        </div>

        <Button 
          className="w-full bg-[#D4AF37] text-black hover:bg-[#F4D03F] font-bold" 
          onClick={handleBuyNow}
        >
          Continue to Checkout
        </Button>
      </DialogContent>
    </Dialog>
  );
}