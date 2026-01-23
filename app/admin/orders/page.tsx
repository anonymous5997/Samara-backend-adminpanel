'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase/client'
import { Eye, Truck, Search, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { format } from 'date-fns'

/* ---------------- STEP 1: CONFIG & HELPERS ---------------- */

// 1.1 Allowed Transitions Map
const STATUS_TRANSITIONS: Record<string, string[]> = {
  pending: ['confirmed', 'packed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: ['returned'],
  returned: [],
  cancelled: [],
}

// 2.1 Courier Detection & Link Helpers
function detectCourier(tracking: string) {
  if (/^\d{8,}$/.test(tracking)) return 'Bluedart'
  if (/^SR/.test(tracking)) return 'Shiprocket'
  return 'Custom'
}

function getTrackingUrl(carrier: string, tracking: string) {
  if (carrier === 'Bluedart')
    return `https://www.bluedart.com/tracking?trackingNo=${tracking}`
  if (carrier === 'Shiprocket')
    return `https://www.shiprocket.in/shipment-tracking/${tracking}`
  return null
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Search & Filter State
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')
  const [search, setSearch] = useState('')

  // Tracking State
  const [trackingInput, setTrackingInput] = useState<{
    [key: string]: { tracking_number: string; carrier: string }
  }>({})
  const [editingTracking, setEditingTracking] = useState<{
    [key: string]: boolean
  }>({})

  // 3.1 Bulk Upload State
  const [showBulk, setShowBulk] = useState(false)
  const [bulkText, setBulkText] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [statusFilter, selectedDate])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (selectedDate) {
        const start = new Date(selectedDate)
        start.setHours(0, 0, 0, 0)
        const end = new Date(selectedDate)
        end.setHours(23, 59, 59, 999)
        query = query
          .gte('created_at', start.toISOString())
          .lte('created_at', end.toISOString())
      }

      const { data, error } = await query
      if (error) throw error

      setOrders(data || [])
    } catch {
      toast.error('Failed to fetch orders')
    } finally {
      setLoading(false)
    }
  }

  /* ---------- STATUS COUNTS ---------- */
  const stats = useMemo(() => {
    const pending = orders.filter((o) => o.status === 'pending').length
    const inTransit = orders.filter((o) =>
      ['packed', 'shipped'].includes(o.status)
    ).length
    const delivered = orders.filter((o) => o.status === 'delivered').length
    const cancelled = orders.filter((o) => o.status === 'cancelled').length
    const returned = orders.filter((o) => o.status === 'returned').length

    return { pending, inTransit, delivered, cancelled, returned }
  }, [orders])

  /* ---------- SEARCH FILTER ---------- */
  const filteredOrders = useMemo(() => {
    if (!search) return orders

    return orders.filter(
      (order) =>
        order.order_number.toLowerCase().includes(search.toLowerCase()) ||
        order.shipping_name?.toLowerCase().includes(search.toLowerCase())
    )
  }, [orders, search])

  /* ---------- 1.2 STRICT STATUS HANDLER (WITH AUDIT) ---------- */
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    const order = orders.find((o) => o.id === orderId)
    if (!order) return

    // Enforce Transition Rules
    const allowed = STATUS_TRANSITIONS[order.status] || []
    
    if (!allowed.includes(newStatus)) {
      toast.error(`Invalid transition: ${order.status} → ${newStatus}`)
      return
    }

    try {
      const updateData: any = { status: newStatus }

      if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      // Audit Log (Step 2)
      await supabase.from('order_audit_logs').insert({
        order_id: orderId,
        action: 'STATUS_CHANGE',
        old_value: { status: order.status },
        new_value: { status: newStatus },
      })

      toast.success('Order status updated')
      fetchOrders()
    } catch (e) {
      console.error(e)
      toast.error('Failed to update order status')
    }
  }

  /* ---------- SINGLE TRACKING SAVE (WITH AUDIT) ---------- */
  const saveTracking = async (orderId: string) => {
    const currentOrder = orders.find((o) => o.id === orderId)
    const values = trackingInput[orderId] || {}

    // Fallback to existing values if not edited
    const trackingNumberToSave =
      values.tracking_number || currentOrder.tracking_number
    const carrierToSave = values.carrier || currentOrder.carrier

    if (!trackingNumberToSave) {
      toast.error('Tracking number required')
      return
    }

    try {
      // 1. Update the Order
      const { error } = await supabase
        .from('orders')
        .update({
          tracking_number: trackingNumberToSave,
          carrier: carrierToSave,
          status: 'shipped', // Auto-move to shipped
        })
        .eq('id', orderId)

      if (error) throw error

      // 2. Audit Log (Step 3 & 4: Create/Update Logging)
      await supabase.from('order_audit_logs').insert({
        order_id: orderId,
        action: 'TRACKING_UPDATED',
        old_value: {
          tracking_number: currentOrder.tracking_number,
          carrier: currentOrder.carrier,
        },
        new_value: {
          tracking_number: trackingNumberToSave,
          carrier: carrierToSave,
        },
      })

      toast.success('Tracking saved')
      setEditingTracking((prev) => ({ ...prev, [orderId]: false }))
      fetchOrders()
    } catch {
      toast.error('Failed to save tracking')
    }
  }

  /* ---------- 3.3 BULK UPLOAD HANDLER ---------- */
  const handleBulkUpload = async () => {
    const rows = bulkText.split('\n')
    let successCount = 0

    try {
      for (const row of rows) {
        // Expected format: order_id,tracking_number,carrier(optional)
        const [orderId, tracking, carrier] = row.split(',').map((s) => s.trim())
        
        if (!orderId || !tracking) continue

        // Auto-detect carrier if not provided in CSV
        const finalCarrier = carrier || detectCourier(tracking)

        const { error } = await supabase
          .from('orders')
          .update({
            tracking_number: tracking,
            carrier: finalCarrier,
            status: 'shipped',
          })
          .eq('id', orderId)

        if (!error) {
           await supabase.from('order_audit_logs').insert({
            order_id: orderId,
            action: 'BULK_TRACKING_UPDATE',
            new_value: { tracking, carrier: finalCarrier },
          })
          successCount++
        }
      }

      toast.success(`Updated ${successCount} orders successfully`)
      setShowBulk(false)
      setBulkText('')
      fetchOrders()
    } catch (e) {
      toast.error('Error processing bulk upload')
    }
  }

  return (
    <>
      <Toaster />
      <div>
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Orders</h1>
          {/* 3.1 Bulk Upload Button */}
          <Button onClick={() => setShowBulk(true)} variant="outline">
            <Upload className="w-4 h-4 mr-2" />
            Bulk Upload Tracking
          </Button>
        </div>

        {/* ---------- SEARCH & FILTER UI ---------- */}
        <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg border items-end">
          <div className="flex-1 min-w-[300px]">
            <label className="text-xs text-gray-500 mb-1 block">
              Search Orders
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search by Order ID or Customer Name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 mb-1 block">
              Filter by Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>

          {selectedDate && (
            <Button variant="outline" onClick={() => setSelectedDate('')}>
              Clear Date
            </Button>
          )}
        </div>

        {/* ---------- STATUS SUMMARY ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatBox
            label="Pending"
            count={stats.pending}
            href="/admin/orders/status/pending"
          />
          <StatBox
            label="In Transit"
            count={stats.inTransit}
            href="/admin/orders/status/in-transit"
          />
          <StatBox
            label="Delivered"
            count={stats.delivered}
            href="/admin/orders/status/delivered"
          />
          <StatBox
            label="Cancelled"
            count={stats.cancelled}
            href="/admin/orders/status/cancelled"
          />
          <StatBox
            label="Returned"
            count={stats.returned}
            href="/admin/orders/status/returned"
          />
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="bg-white rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Tracking</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow
                    key={order.id}
                    className="hover:bg-gray-50 transition"
                  >
                    <TableCell className="font-medium">
                      {order.order_number}
                    </TableCell>

                    <TableCell>
                      <p className="font-medium">{order.shipping_name}</p>
                      <p className="text-xs text-gray-500">
                        {order.shipping_phone}
                      </p>
                    </TableCell>

                    <TableCell>
                      ₹{Number(order.total_amount_inr).toFixed(2)}
                    </TableCell>

                    <TableCell>
                      <Select
                        value={order.status}
                        onValueChange={(value) =>
                          handleStatusChange(order.id, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="packed">Packed</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>

                    <TableCell>
                      {editingTracking[order.id] || !order.tracking_number ? (
                        <div className="space-y-1 w-40">
                          {/* 2.2 AUTO-FILL CARRIER ON INPUT */}
                          <Input
                            placeholder="Tracking #"
                            className="h-7 text-xs"
                            defaultValue={order.tracking_number || ''}
                            onChange={(e) => {
                                const val = e.target.value
                                const detected = detectCourier(val)
                                setTrackingInput((prev) => ({
                                  ...prev,
                                  [order.id]: {
                                    ...prev[order.id] || { carrier: order.carrier || '' },
                                    tracking_number: val,
                                    carrier: detected, // Auto-set
                                  },
                                }))
                            }}
                          />
                          <Input
                            placeholder="Carrier"
                            className="h-7 text-xs"
                            // Use state if available (for auto-detect), else DB value
                            value={trackingInput[order.id]?.carrier ?? order.carrier ?? ''}
                            onChange={(e) =>
                              setTrackingInput((prev) => ({
                                ...prev,
                                [order.id]: {
                                  ...prev[order.id] || { tracking_number: order.tracking_number || '' },
                                  carrier: e.target.value,
                                },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7 bg-black text-white hover:bg-gray-800"
                            onClick={() => saveTracking(order.id)}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                          {order.tracking_number && (
                            <button
                              className="text-[10px] text-gray-500 w-full text-center underline"
                              onClick={() =>
                                setEditingTracking((prev) => ({
                                  ...prev,
                                  [order.id]: false,
                                }))
                              }
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs space-y-1">
                          {/* 2.3 CLICKABLE LINK */}
                          <p className="font-medium">
                            <a
                              href={getTrackingUrl(order.carrier, order.tracking_number) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline hover:text-blue-800"
                            >
                              {order.tracking_number}
                            </a>
                          </p>
                          <p className="text-gray-500">{order.carrier}</p>

                          {!['cancelled', 'returned'].includes(
                            order.status
                          ) && (
                            <button
                              className="text-gray-400 underline text-[11px] hover:text-gray-600"
                              onClick={() =>
                                setEditingTracking((prev) => ({
                                  ...prev,
                                  [order.id]: true,
                                }))
                              }
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {format(new Date(order.created_at), 'MMM dd, yyyy')}
                    </TableCell>

                    <TableCell>
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/orders/${order.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* 3.2 BULK UPLOAD MODAL */}
      {showBulk && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-lg space-y-4 shadow-lg">
            <h2 className="text-xl font-bold">Bulk Tracking Update</h2>
            <p className="text-sm text-gray-500">
              Paste CSV data below. Format: <br />
              <code className="bg-gray-100 p-1 rounded">order_id, tracking_number, carrier (optional)</code>
            </p>
            
            <textarea
              placeholder={`e.g.\n123e4567-e89b..., 123456789, Bluedart\n987e6543-e21b..., SR123456, Shiprocket`}
              rows={8}
              className="w-full border rounded p-3 text-sm font-mono"
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowBulk(false)}>
                Cancel
              </Button>
              <Button onClick={handleBulkUpload}>
                Apply Updates
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatBox({
  label,
  count,
  href,
}: {
  label: string
  count: number
  href: string
}) {
  return (
    <Link href={href}>
      <div className="border rounded-lg p-4 bg-white cursor-pointer hover:border-black transition">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold">{count}</p>
      </div>
    </Link>
  )
}