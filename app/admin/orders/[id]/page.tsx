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
import { ArrowLeft, XCircle, RotateCcw, ClipboardList } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

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

  /* 1️⃣ STEP 5: Add Audit Logs State */
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    // A. Fetch Order Details
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

    // B. STEP 5: Fetch Audit Logs
    if (orderId) {
      const { data: logs } = await supabase
        .from('order_audit_logs')
        .select('*')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false }) // Newest on top
      
      setAuditLogs(logs || [])
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
    try {
      await supabase
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id)

      await supabase.from('order_audit_logs').insert({
        order_id: order.id,
        action: 'CANCELLED_BY_ADMIN',
        old_value: { status: order.status },
        new_value: { status: 'cancelled' },
      })

      toast.success('Order cancelled')
      fetchOrder()
    } catch {
      toast.error('Failed to cancel order')
    }
  }

  const approveReturn = async () => {
    try {
      await supabase
        .from('orders')
        .update({ status: 'returned' })
        .eq('id', order.id)

      await supabase.from('order_audit_logs').insert({
        order_id: order.id,
        action: 'RETURN_APPROVED',
        old_value: { status: order.status },
        new_value: { status: 'returned' },
      })

      toast.success('Return approved')
      fetchOrder()
    } catch {
      toast.error('Failed to approve return')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">
          Order #{order.order_number}
        </h1>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-xs text-gray-500">Order Status</p>
          <Badge className={`mt-1 ${statusColor}`}>{effectiveStatus}</Badge>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-xs text-gray-500">Payment Status</p>
          <Badge className={`mt-1 ${paymentColor}`}>
            {order.payment_status}
          </Badge>
        </div>

        <div className="border rounded-lg p-4 bg-white shadow-sm">
          <p className="text-xs text-gray-500">Total Amount</p>
          <p className="text-lg font-semibold mt-1">
            ₹{Number(order.total_amount_inr).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN (2/3 width): Shipping & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="border rounded-lg p-6 bg-white shadow-sm">
            <h2 className="font-semibold mb-4 text-lg">Shipping Details</h2>

            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium text-gray-500 w-32">Name</TableCell>
                  <TableCell>{order.shipping_name}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-500">Phone</TableCell>
                  <TableCell>{order.shipping_phone}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium text-gray-500 align-top pt-3">Address</TableCell>
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
                  <TableCell className="font-medium text-gray-500">Tracking</TableCell>
                  <TableCell>
                    {order.tracking_number ? (
                      <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                        {order.tracking_number} ({order.carrier || 'Courier'})
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">Not assigned</span>
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {effectiveStatus !== 'cancelled' &&
              effectiveStatus !== 'delivered' &&
              effectiveStatus !== 'returned' && (
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

        {/* RIGHT COLUMN (1/3 width): 2️⃣ STEP 6 Audit Timeline */}
        <div className="border rounded-lg p-4 h-fit bg-gray-50/80 shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-200">
            <ClipboardList className="w-4 h-4 text-gray-500" />
            <h2 className="font-semibold text-gray-700">Audit History</h2>
          </div>
          
          {auditLogs.length === 0 ? (
            <p className="text-sm text-gray-400 italic text-center py-4">
              No activity recorded yet.
            </p>
          ) : (
            <div className="space-y-6 pl-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="border-l-2 border-gray-300 pl-4 relative">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[9px] top-0 h-4 w-4 rounded-full bg-gray-100 border-2 border-gray-400" />

                  {/* Date */}
                  <p className="text-xs text-gray-500 mb-1 font-mono">
                    {format(new Date(log.created_at), 'dd MMM yyyy, hh:mm a')}
                  </p>

                  {/* Action Name */}
                  <p className="text-sm font-semibold text-gray-800">
                    {log.action.replace(/_/g, ' ')}
                  </p>

                  {/* Changes Diff */}
                  {log.old_value && log.new_value && (
                    <div className="mt-2 text-xs bg-white border rounded p-2 text-gray-600 overflow-x-auto">
                      {Object.keys(log.new_value).map((key) => (
                        <div key={key} className="flex flex-col gap-1 mb-1 last:mb-0">
                          <span className="uppercase text-[10px] text-gray-400 font-bold tracking-wider">
                            {key.replace(/_/g, ' ')}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="line-through text-red-400 opacity-75">
                              {String(log.old_value[key] || '—')}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-medium text-green-700">
                              {String(log.new_value[key])}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}