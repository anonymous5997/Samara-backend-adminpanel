'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Loader2, Package, Truck, CheckCircle2, AlertCircle } from 'lucide-react';

type OrderStatus = 'pending' | 'packed' | 'shipped' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  order_number: string;      // adjust to your column name if different
  status: OrderStatus;
  tracking_number: string | null;
  shipping_carrier: string | null;
  created_at: string;
  estimated_delivery: string | null;
}

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setOrder(null);

    if (!orderNumber.trim()) {
      setError('Please enter your order number');
      return;
    }

    setLoading(true);
    try {
      // 🔐 Basic security: match on order_number + email if provided
      let query = supabase
        .from('orders')
        .select('id, order_number, status, tracking_number, shipping_carrier, created_at, estimated_delivery')
        .eq('order_number', orderNumber.trim());

      if (email.trim()) {
        query = query.eq('customer_email', email.trim()); // change column name if needed
      }

      const { data, error: supaError } = await query.maybeSingle();

      if (supaError) {
        console.error(supaError);
        setError('Something went wrong. Please try again.');
      } else if (!data) {
        setError('Order not found. Please check your details and try again.');
      } else {
        setOrder(data as Order);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderStatusBadge = (status: OrderStatus) => {
    const base = 'inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold';

    switch (status) {
      case 'pending':
        return <span className={`${base} bg-yellow-100 text-yellow-800`}>Pending</span>;
      case 'packed':
        return <span className={`${base} bg-blue-100 text-blue-800`}>Packed</span>;
      case 'shipped':
        return <span className={`${base} bg-sky-100 text-sky-800`}>Shipped</span>;
      case 'delivered':
        return <span className={`${base} bg-emerald-100 text-emerald-800`}>Delivered</span>;
      case 'cancelled':
        return <span className={`${base} bg-red-100 text-red-800`}>Cancelled</span>;
      default:
        return <span className={base}>Unknown</span>;
    }
  };

  const renderTimelineIcon = (active: boolean, done: boolean, icon: React.ReactNode) => (
    <div
      className={`flex items-center justify-center w-8 h-8 rounded-full border ${
        done
          ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
          : active
          ? 'border-[#D4AF37] text-[#D4AF37]'
          : 'border-gray-600 text-gray-600'
      }`}
    >
      {icon}
    </div>
  );

  const stepIndex = (status: OrderStatus): number => {
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
        return 0; // treat as early stop
      default:
        return 0;
    }
  };

  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];

  return (
    <div className="bg-black min-h-screen text-white">
      <div className="container mx-auto px-4 md:px-8 py-12 md:py-16 max-w-3xl">
        <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2 text-[#D4AF37]">
          Track Your Order
        </h1>
        <p className="text-sm text-gray-400 mb-8">
          Enter your order number and (optionally) your email to see the latest status.
        </p>

        <Card className="bg-[#050505] border border-[#D4AF37]/20 mb-8">
          <CardHeader>
            <CardTitle className="text-lg text-[#F5F5F5]">Order Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orderNumber" className="text-sm text-gray-300">
                  Order Number
                </Label>
                <Input
                  id="orderNumber"
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. SAMARA12345"
                  className="bg-black border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm text-gray-300">
                  Email (optional, for extra security)
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="bg-black border-[#D4AF37]/30 text-white placeholder:text-gray-600"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-black font-semibold hover:shadow-lg hover:shadow-[#D4AF37]/40"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Checking…
                  </>
                ) : (
                  'Track Order'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {order && (
          <Card className="bg-[#050505] border border-[#D4AF37]/20">
            <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="text-lg text-[#F5F5F5]">
                  Order #{order.order_number}
                </CardTitle>
                <p className="text-xs text-gray-500">
                  Placed on {new Date(order.created_at).toLocaleString()}
                </p>
              </div>
              <div>{renderStatusBadge(order.status)}</div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Timeline */}
              <div>
                <h3 className="text-sm font-semibold text-[#D4AF37] mb-3">
                  Delivery Progress
                </h3>
                <div className="flex items-center justify-between gap-2 text-xs">
                  {steps.map((step, idx) => {
                    const current = stepIndex(order.status);
                    const done = idx <= current;
                    const active = idx === current;

                    return (
                      <div key={step} className="flex-1 flex flex-col items-center">
                        {renderTimelineIcon(
                          active,
                          done,
                          idx === 0 ? (
                            <Package className="w-4 h-4" />
                          ) : idx === steps.length - 1 ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Truck className="w-4 h-4" />
                          )
                        )}
                        <span
                          className={`mt-2 text-center ${
                            done ? 'text-white' : 'text-gray-500'
                          }`}
                        >
                          {step}
                        </span>
                        {idx < steps.length - 1 && (
                          <div className="hidden md:block w-full h-px bg-gradient-to-r from-gray-700 to-gray-700 mt-3" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Shipping details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
                <div className="space-y-1">
                  <p className="text-gray-500">Tracking Number</p>
                  <p className="font-mono">
                    {order.tracking_number || 'Not assigned yet'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Carrier</p>
                  <p>{order.shipping_carrier || 'Will be updated soon'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-gray-500">Estimated Delivery</p>
                  <p>
                    {order.estimated_delivery
                      ? new Date(order.estimated_delivery).toDateString()
                      : 'Will be shared after dispatch'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
