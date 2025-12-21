'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount_inr: number
  created_at: string
  tracking_number: string | null
  carrier: string | null
  shipping_name: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
}

export default function OrderDetailsPage() {
  const params = useParams()
  const orderId = typeof params?.id === 'string' ? params.id : null

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  /* ---------------- FETCH ORDER ---------------- */
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_amount_inr,
          created_at,
          tracking_number,
          carrier,
          shipping_name,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_pincode
        `)
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder(data)
      } else {
        setOrder(null)
      }

      setLoading(false)
    }

    fetchOrder()
  }, [orderId])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-white">
        Loading order…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-white">
        Order not found.
      </div>
    )
  }

  /* ---------------- STATUS FIX ---------------- */
  const displayStatus =
    order.payment_status === 'paid' && order.status === 'pending'
      ? 'confirmed'
      : order.status

  const isCancelled = displayStatus === 'cancelled'
  const isDelivered = displayStatus === 'delivered'
  const isShipped = displayStatus === 'shipped'
  const isPaid = order.payment_status === 'paid'

  /* ---------------- DELIVERY STEPS ---------------- */
  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered']

  const stepIndex = isCancelled
    ? 0
    : displayStatus === 'packed'
    ? 1
    : displayStatus === 'shipped'
    ? 2
    : displayStatus === 'delivered'
    ? 3
    : 0

  /* ---------------- ACTION RULES ---------------- */
  const canCancel = !isCancelled && !isShipped && !isDelivered
  const canReturn = isDelivered && !isCancelled

  /* ---------------- ACTION HANDLERS ---------------- */
  const cancelOrder = async () => {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    setOrder({ ...order, status: 'cancelled' })
  }

  const requestReturn = async () => {
    await supabase
      .from('orders')
      .update({ status: 'return_requested' })
      .eq('id', order.id)

    setOrder({ ...order, status: 'return_requested' })
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <Card className="bg-black border border-[#D4AF37]/40">
        <CardHeader className="border-b border-[#D4AF37]/30">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl text-white">
                Order #{order.order_number}
              </CardTitle>
              <p className="text-sm text-gray-300 mt-1">
                {format(new Date(order.created_at), 'MMMM dd, yyyy')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-white">
                ₹{order.total_amount_inr.toFixed(2)}
              </p>

              <div className="flex gap-2 justify-end mt-2 flex-wrap">
                <span
                  className={`px-2 py-1 text-xs rounded capitalize font-medium
                    ${
                      displayStatus === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : displayStatus === 'confirmed'
                        ? 'bg-blue-600 text-white'
                        : displayStatus === 'shipped'
                        ? 'bg-purple-600 text-white'
                        : displayStatus === 'delivered'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-black'
                    }
                  `}
                >
                  {displayStatus}
                </span>

                <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">
                  {order.payment_status}
                </span>

                {isCancelled && isPaid && (
                  <span className="px-2 py-1 text-xs rounded bg-orange-500 text-black">
                    Refund processing
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-10 pt-8">
          {/* DELIVERY PROGRESS */}
          <div>
            <p className="font-semibold mb-6 text-white">
              Delivery Progress
            </p>

            <div className="relative flex justify-between items-center">
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-700" />

              <div
                className="absolute top-4 left-0 h-[2px] bg-[#D4AF37]"
                style={{ width: `${(stepIndex / 3) * 100}%` }}
              />

              {steps.map((step, i) => {
                const active = i <= stepIndex && !isCancelled

                return (
                  <div
                    key={step}
                    className="relative z-10 flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                        active
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                          : 'bg-black border-gray-600 text-gray-400'
                      }`}
                    >
                      {i === 0 ? (
                        <Package className="w-4 h-4" />
                      ) : i === 3 ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>

                    <span
                      className={`mt-3 text-xs ${
                        active ? 'text-[#D4AF37]' : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TRACKING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-400">Tracking Number</p>
              <p className="text-white">
                {order.tracking_number || 'Not assigned yet'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Carrier</p>
              <p className="text-white">
                {order.carrier || 'Will be updated soon'}
              </p>
            </div>
          </div>

          {/* SHIPPING */}
          <div className="text-sm">
            <p className="text-gray-400 mb-2">Shipping Address</p>
            <p className="text-white">{order.shipping_name}</p>
            <p className="text-white">{order.shipping_address}</p>
            <p className="text-white">
              {order.shipping_city}, {order.shipping_state} –{' '}
              {order.shipping_pincode}
            </p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 flex-wrap">
            {canCancel && (
              <Button variant="destructive" onClick={cancelOrder}>
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>
            )}

            {canReturn && (
              <Button variant="outline" onClick={requestReturn}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Request Return
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
