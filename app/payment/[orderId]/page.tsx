'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PaymentPage() {
  const { orderId } = useParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    startPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const startPayment = async () => {
    try {
      // 1️⃣ Fetch order from DB
      const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error || !order) {
        toast.error('Order not found');
        router.replace('/');
        return;
      }

      // 2️⃣ Create Razorpay order (backend API)
      const res = await fetch('/api/razorpay/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: order.total_amount_inr,
          orderId: order.id,
        }),
      });

      const rpOrder = await res.json();

      if (!rpOrder?.id) {
        throw new Error('Failed to create Razorpay order');
      }

      // 3️⃣ Open Razorpay
      const razorpay = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: rpOrder.amount,
        currency: 'INR',
        name: 'Samara',
        description: `Order #${order.order_number}`,
        order_id: rpOrder.id,
        prefill: {
          name: order.shipping_name,
          email: order.shipping_email,
          contact: order.shipping_phone,
        },
        theme: { color: '#D4AF37' },

        // ---------------------------------------------------------
        // ✅ DEBUGGING HANDLER (ALERTS + LOGS + DELAY)
        // ---------------------------------------------------------
        handler: async (response: any) => {
          // ✅ Step 1: Confirm Handler Fires
          console.log("🔥 PAYMENT SUCCESS HANDLER EXECUTED");
          alert("Payment Success Handler Triggered");

          console.log("Payment response:", response);

          // 1️⃣ Update order status
          const { error: orderError } = await supabase
            .from('orders')
            .update({
              status: 'confirmed',
              payment_status: 'paid',
              razorpay_order_id: rpOrder.id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            .eq('id', order.id);

          if (orderError) {
            console.error("❌ Order update failed:", orderError.message);
            // We continue even if update fails to try and log analytics, or you can return
          } else {
            console.log("✅ Order marked as paid.");
          }

          // ✅ Step 2: Analytics Insert with Detailed Logging
          console.log("🚀 Attempting analytics insert...");
          
          const insertResult = await supabase
            .from('analytics_events')
            .insert({
              event_type: 'checkout_completed',
              order_id: order.id,
              user_id: order.user_id,
            })
            .select();

          console.log("📦 Insert result:", insertResult);

          if (insertResult.error) {
            console.error("❌ Analytics insert FAILED:", insertResult.error.message);
          } else {
            console.log("✅ Analytics insert SUCCESS");
          }

          // ✅ Step 3: Forced Delay to prevent premature unmount
          console.log("⏳ Waiting 2 seconds before redirect...");
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          router.replace(`/orders/${order.id}`);
        },

        modal: {
          ondismiss: async () => {
            await supabase
              .from('orders')
              .update({ payment_status: 'failed' })
              .eq('id', order.id);

            toast.error('Payment cancelled');
            router.replace('/checkout');
          },
        },
      });

      razorpay.open();
    } catch (err) {
      console.error(err);
      toast.error('Payment failed');
      router.replace('/checkout');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <div className="flex items-center gap-2">
        <Loader2 className="animate-spin text-[#D4AF37]" />
        <span>Redirecting to payment...</span>
      </div>
    </div>
  );
}