'use client';

import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productPrice: number;
  productImage?: string | null;
}

export function BuyNowModal({
  isOpen,
  onClose,
  productId,
  productName,
  productPrice,
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

    sessionStorage.setItem(
      'buynow_product',
      JSON.stringify({
        productId,
        productName,
        productPrice,
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
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X />
          </Button>
        </div>

        <p className="text-sm mb-6">
          You will be redirected to checkout to complete your purchase.
        </p>

        <Button className="w-full" onClick={handleBuyNow}>
          Continue to Checkout
        </Button>
      </DialogContent>
    </Dialog>
  );
}
