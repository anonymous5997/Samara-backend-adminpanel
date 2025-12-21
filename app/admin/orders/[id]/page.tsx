'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, XCircle, RotateCcw } from 'lucide-react'

type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount_inr: number
  razorpay_order_id: string | null
  razorpay_payment_id: string | null
  tracking_number: string | null
  carrier: string | null
  shipping_name: string | null
  shipping_phone: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  shipping_country: string | null
  created_at: string
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()

  const orderId = typeof params?.id === 'string' ? params.id : null

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        status,
        payment_status,
        total_amount_inr,
        razorpay_order_id,
        razorpay_payment_id,
        tracking_number,
        carrier,
        shipping_name,
        shipping_phone,
        shipping_address,
        shipping_city,
        shipping_state,
        shipping_pincode,
        shipping_country,
        created_at
      `)
      .eq('id', orderId)
      .single()

    if (error) {
      console.error('Order fetch failed:', error)
      setOrder(null)
    } else {
      setOrder(data)
    }

    setLoading(false)
  }

  if (loading) return <div className="p-6">Loading order...</div>
  if (!order) return <div className="p-6">Order not found</div>

  /* ✅ STATUS NORMALIZATION */
  const effectiveStatus =
    order.payment_status === 'paid' && order.status === 'pending'
      ? 'confirmed'
      : order.status

  const statusColor =
    effectiveStatus === 'delivered'
      ? 'bg-green-100 text-green-800'
      : effectiveStatus === 'cancelled'
      ? 'bg-red-100 text-red-800'
      : effectiveStatus === 'returned'
      ? 'bg-purple-100 text-purple-800'
      : effectiveStatus === 'confirmed'
      ? 'bg-yellow-100 text-yellow-800'
      : 'bg-blue-100 text-blue-800'

  const paymentColor =
    order.payment_status === 'paid'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800'

  /* ✅ ADMIN ACTIONS */
  const cancelOrder = async () => {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)

    fetchOrder()
  }

  const approveReturn = async () => {
    await supabase
      .from('orders')
      .update({ status: 'returned' })
      .eq('id', order.id)

    fetchOrder()
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        <h1 className="text-2xl font-bold">
          Order #{order.order_number}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500">Order Status</p>
          <Badge className={statusColor}>{effectiveStatus}</Badge>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500">Payment Status</p>
          <Badge className={paymentColor}>
            {order.payment_status}
          </Badge>
        </div>

        <div className="border rounded-lg p-4">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-lg font-semibold">
            ₹{Number(order.total_amount_inr).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border rounded-lg p-4">
        <h2 className="font-semibold mb-2">Shipping Details</h2>

        <Table>
          <TableBody>
            <TableRow>
              <TableCell className="font-medium">Name</TableCell>
              <TableCell>{order.shipping_name}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Phone</TableCell>
              <TableCell>{order.shipping_phone}</TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Address</TableCell>
              <TableCell>
                {order.shipping_address}
                <br />
                {order.shipping_city}, {order.shipping_state} –{' '}
                {order.shipping_pincode}
                <br />
                {order.shipping_country}
              </TableCell>
            </TableRow>

            <TableRow>
              <TableCell className="font-medium">Tracking</TableCell>
              <TableCell>
                {order.tracking_number
                  ? `${order.tracking_number} (${order.carrier || 'Courier'})`
                  : 'Not assigned'}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* ✅ ADMIN ACTION BUTTONS */}
      <div className="flex gap-3">
        {effectiveStatus !== 'cancelled' &&
          effectiveStatus !== 'delivered' && (
            <Button variant="destructive" onClick={cancelOrder}>
              <XCircle className="w-4 h-4 mr-1" />
              Cancel Order
            </Button>
          )}

        {effectiveStatus === 'return_requested' && (
          <Button onClick={approveReturn}>
            <RotateCcw className="w-4 h-4 mr-1" />
            Approve Return
          </Button>
        )}
      </div>
    </div>
  )
}
