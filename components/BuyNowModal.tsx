'use client';

import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { X, Loader2 } from 'lucide-react';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { PhoneOtpForm } from '@/components/auth/PhoneOtpForm';


interface BuyNowModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
  productPrice: number;
  productImage: string | null;
}

declare global {
  interface Window {
    Razorpay: any;
  }
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
  const [step, setStep] = useState<'auth' | 'address' | 'processing'>('auth');
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    state: '',
    pincode: '',
    country: 'India',
  });

  const handleSendOtp = async () => {
    if (!email) {
      toast.error('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) throw error;

      setOtpSent(true);
      toast.success('OTP sent to your email!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const { data , error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) throw error;
      if (!data?.user) {
  throw new Error('Authentication failed');
};

      toast.success('Logged in successfully!');
      setStep('address');
    } catch (error: any) {
      toast.error(error.message || 'Invalid OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToPayment = async () => {
    if (
      !shippingAddress.name ||
      !shippingAddress.phone ||
      !shippingAddress.address_line_1 ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      toast.error('Please fill in all required fields');
      return;
    }

    setStep('processing');
    setLoading(true);

    try {
      const currentUser = user || (await supabase.auth.getUser()).data.user;
      if (!currentUser) {
        throw new Error('User not authenticated');
      }

      const orderData = {
        user_id: currentUser.id,
        total_amount_inr: productPrice,
        currency: 'INR',
        status: 'PENDING',
        payment_status: 'PENDING',
        shipping_name: shippingAddress.name,
        shipping_phone: shippingAddress.phone,
        shipping_address_line_1: shippingAddress.address_line_1,
        shipping_address_line_2: shippingAddress.address_line_2,
        shipping_city: shippingAddress.city,
        shipping_state: shippingAddress.state,
        shipping_pincode: shippingAddress.pincode,
        shipping_country: shippingAddress.country,
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      const { error: orderItemError } = await supabase.from('order_items').insert({
        order_id: order.id,
        product_id: productId,
        quantity: 1,
        unit_price_inr: productPrice,
        subtotal_inr: productPrice,
      });

      if (orderItemError) throw orderItemError;

      const razorpayOrderResponse = await fetch('/api/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: productPrice,
          orderId: order.id,
        }),
      });

      if (!razorpayOrderResponse.ok) {
        throw new Error('Failed to create Razorpay order');
      }

      const razorpayOrder = await razorpayOrderResponse.json();

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: 'INR',
        name: 'Samara',
        description: productName,
        order_id: razorpayOrder.id,
        prefill: {
          name: shippingAddress.name,
          email: currentUser.email,
          contact: shippingAddress.phone,
        },
        theme: {
          color: '#D4AF37',
        },
        handler: async function (response: any) {
          try {
            await supabase
              .from('orders')
              .update({
                status: 'CONFIRMED',
                payment_status: 'PAID',
                razorpay_order_id: razorpayOrder.id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              })
              .eq('id', order.id);

            await supabase.from('analytics_events').insert({
              event_type: 'order_placed',
              user_id: currentUser.id,
              event_data: {
                order_id: order.id,
                product_id: productId,
                amount: productPrice,
              },
            });

            toast.success('Order placed successfully!');
            onClose();
            window.location.href = `/orders?order_id=${order.id}`;
          } catch (error) {
            console.error('Error updating order:', error);
            toast.error('Payment successful but order update failed');
          }
        },
        modal: {
          ondismiss: async function () {
            await supabase
              .from('orders')
              .update({ payment_status: 'FAILED' })
              .eq('id', order.id);

            setStep('address');
            setLoading(false);
            toast.error('Payment cancelled');
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      setLoading(false);
    } catch (error: any) {
      console.error('Buy now error:', error);
      toast.error(error.message || 'Failed to process order');
      setStep('address');
      setLoading(false);
    }
  };

  const handleOpen = () => {
    if (user) {
      setStep('address');
    } else {
      setStep('auth');
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          handleOpen();
        } else {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-md bg-black border-2 border-[#D4AF37] text-white">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-2xl font-bold text-[#D4AF37]">
            {step === 'auth' ? 'Login to Continue' : step === 'address' ? 'Shipping Address' : 'Processing...'}
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-[#D4AF37] hover:bg-[#D4AF37]/10"
            disabled={loading}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {step === 'auth' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-gray-300">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="bg-[#111] border-[#D4AF37]/30 text-white"
                disabled={otpSent}
              />
            </div>

            {otpSent && (
              <div>
                <Label htmlFor="otp" className="text-gray-300">
                  Enter OTP
                </Label>
                <Input
                  id="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                  maxLength={8}
                />
              </div>
            )}

            <Button
              onClick={otpSent ? handleVerifyOtp : handleSendOtp}
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : otpSent ? (
                'Verify OTP'
              ) : (
                'Send OTP'
              )}
            </Button>
          </div>
        )}

        {step === 'address' && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-gray-300">
                  Full Name *
                </Label>
                <Input
                  id="name"
                  value={shippingAddress.name}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, name: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-300">
                  Phone *
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="address1" className="text-gray-300">
                Address Line 1 *
              </Label>
              <Input
                id="address1"
                value={shippingAddress.address_line_1}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, address_line_1: e.target.value })
                }
                className="bg-[#111] border-[#D4AF37]/30 text-white"
              />
            </div>

            <div>
              <Label htmlFor="address2" className="text-gray-300">
                Address Line 2
              </Label>
              <Input
                id="address2"
                value={shippingAddress.address_line_2}
                onChange={(e) =>
                  setShippingAddress({ ...shippingAddress, address_line_2: e.target.value })
                }
                className="bg-[#111] border-[#D4AF37]/30 text-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-gray-300">
                  City *
                </Label>
                <Input
                  id="city"
                  value={shippingAddress.city}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, city: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-gray-300">
                  State *
                </Label>
                <Input
                  id="state"
                  value={shippingAddress.state}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, state: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pincode" className="text-gray-300">
                  Pincode *
                </Label>
                <Input
                  id="pincode"
                  value={shippingAddress.pincode}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, pincode: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-gray-300">
                  Country *
                </Label>
                <Input
                  id="country"
                  value={shippingAddress.country}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, country: e.target.value })
                  }
                  className="bg-[#111] border-[#D4AF37]/30 text-white"
                />
              </div>
            </div>

            <div className="border-t border-[#D4AF37]/30 pt-4 mt-4">
              <div className="flex justify-between mb-4">
                <span className="text-gray-300">Total Amount:</span>
                <span className="text-[#D4AF37] font-bold text-xl">
                  ₹{productPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <Button
                onClick={handleProceedToPayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold py-6"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Proceed to Payment'}
              </Button>
            </div>
          </div>
        )}

        {step === 'processing' && (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="h-12 w-12 animate-spin text-[#D4AF37] mb-4" />
            <p className="text-gray-400">Processing your order...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
