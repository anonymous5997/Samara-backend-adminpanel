'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import {
  ShoppingBag,
  Package,
  Truck,
  CheckCircle2,
  Clock
} from 'lucide-react';

import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase/client';
import { Order } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/* =========================================================
   🔹 TYPES (ADDED – nothing removed)
========================================================= */

type TrackingEvent = {
  status: string;
  created_at: string;
};

type OrderWithTracking = Order & {
  tracking_number?: string | null;
  shipping_carrier?: string | null;
  estimated_delivery?: string | null;
  order_tracking_events?: TrackingEvent[];
};

type OrderStatus = Order['status'];

/* =========================================================
   🔹 COMPONENT
========================================================= */

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [orders, setOrders] = useState<OrderWithTracking[]>([]);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     🔹 FETCH ORDERS (ENHANCED – not replaced)
  ========================================================= */

  useEffect(() => {
    if (!user) {
      router.push('/auth/login');
      return;
    }

    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_tracking_events (
            status,
            created_at
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .order('created_at', {
          foreignTable: 'order_tracking_events',
          ascending: true
        });

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      if (data) {
        setOrders(data as OrderWithTracking[]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================
     🔹 EXISTING HELPERS (UNCHANGED)
  ========================================================= */

  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered'] as const;

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'pending':
        return 0;
      case 'packed':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      case 'cancelled':
        return 0;
      default:
        return 0;
    }
  };

  /* =========================================================
     🔹 NEW HELPER (ADDED)
     Uses tracking events if available (Flipkart style)
  ========================================================= */

  const getStepIndexFromEvents = (
    order: OrderWithTracking
  ): number => {
    if (!order.order_tracking_events?.length) {
      return getStepIndex(order.status);
    }

    const completed = order.order_tracking_events.map(
      e => e.status
    );

    if (completed.includes('delivered')) return 3;
    if (completed.includes('shipped')) return 2;
    if (completed.includes('packed')) return 1;
    if (completed.includes('order_placed')) return 0;

    return getStepIndex(order.status);
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const base =
      'px-2 py-1 rounded-full text-xs font-semibold capitalize';

    if (status === 'delivered') {
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          delivered
        </span>
      );
    }
    if (status === 'cancelled') {
      return (
        <span className={`${base} bg-red-100 text-red-800`}>
          cancelled
        </span>
      );
    }
    return (
      <span className={`${base} bg-blue-100 text-blue-800`}>
        {status}
      </span>
    );
  };

  const renderPaymentBadge = (
    paymentStatus: Order['payment_status']
  ) => {
    const base =
      'px-2 py-1 rounded-full text-xs font-semibold capitalize';

    if (paymentStatus === 'paid') {
      return (
        <span className={`${base} bg-green-100 text-green-800`}>
          paid
        </span>
      );
    }
    if (paymentStatus === 'failed') {
      return (
        <span className={`${base} bg-red-100 text-red-800`}>
          failed
        </span>
      );
    }
    return (
      <span className={`${base} bg-yellow-100 text-yellow-800`}>
        {paymentStatus}
      </span>
    );
  };

  const renderStepIcon = (idx: number, current: number) => {
    const done = idx <= current;

    const base =
      'flex items-center justify-center w-7 h-7 rounded-full border text-xs';

    let icon = <Truck className="w-4 h-4" />;
    if (idx === 0) icon = <Package className="w-4 h-4" />;
    if (idx === steps.length - 1)
      icon = <CheckCircle2 className="w-4 h-4" />;

    if (done) {
      return (
        <div className={`${base} bg-[#D4AF37] border-[#D4AF37] text-black`}>
          {icon}
        </div>
      );
    }

    return (
      <div className={`${base} border-gray-400 text-gray-400`}>
        {icon}
      </div>
    );
  };

  /* =========================================================
     🔹 LOADING / EMPTY (UNCHANGED)
  ========================================================= */

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <ShoppingBag className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h1 className="text-2xl font-bold mb-4">No orders yet</h1>
          <Button asChild>
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>
      </div>
    );
  }

  /* =========================================================
     🔹 MAIN UI (UNCHANGED + enhanced logic)
  ========================================================= */

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

      <div className="space-y-4">
        {orders.map(order => {
          const currentStep = getStepIndexFromEvents(order);

          return (
            <Card key={order.id} className="border border-[#D4AF37]/30">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      Order #{order.order_number}
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      {format(new Date(order.created_at), 'MMMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">
                      ₹{Number(order.total_amount_inr).toFixed(2)}
                    </p>
                    <div className="flex gap-2 mt-2 justify-end">
                      {renderStatusBadge(order.status)}
                      {renderPaymentBadge(order.payment_status)}
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Delivery Progress */}
                <div>
                  <div className="flex justify-between mb-2 text-sm font-semibold">
                    <span>Delivery Progress</span>
                    {order.estimated_delivery && (
                      <span className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        ETA{' '}
                        {format(
                          new Date(order.estimated_delivery),
                          'dd MMM'
                        )}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between">
                    {steps.map((step, idx) => (
                      <div
                        key={step}
                        className="flex-1 flex flex-col items-center"
                      >
                        {renderStepIcon(idx, currentStep)}
                        <span
                          className={`mt-2 text-xs ${
                            idx <= currentStep
                              ? 'text-gray-900'
                              : 'text-gray-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Tracking Number</p>
                    <p className="font-mono">
                      {order.tracking_number || 'Not assigned yet'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Carrier</p>
                    <p>
                      {order.shipping_carrier || 'Will be updated soon'}
                    </p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="text-sm text-gray-700">
                  <p className="text-gray-500 mb-1">Shipping to</p>
                  <p>{order.shipping_name}</p>
                  <p>{order.shipping_address}</p>
                  <p>
                    {order.shipping_city}, {order.shipping_state} -{' '}
                    {order.shipping_pincode}
                  </p>
                </div>

                <Button asChild variant="outline" size="sm">
                  <Link href={`/orders/${order.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
