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
import { Eye, Truck } from 'lucide-react'
import { toast } from 'sonner'
import { Toaster } from '@/components/ui/sonner'
import { format } from 'date-fns'

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState('')

  const [trackingInput, setTrackingInput] = useState<{
    [key: string]: { tracking_number: string; carrier: string }
  }>({})

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
    const pending = orders.filter(o => o.status === 'pending').length
    const inTransit = orders.filter(o =>
      ['packed', 'shipped'].includes(o.status)
    ).length
    const delivered = orders.filter(o => o.status === 'delivered').length
    const cancelled = orders.filter(o => o.status === 'cancelled').length
    const returned = orders.filter(o => o.status === 'returned').length

    return { pending, inTransit, delivered, cancelled, returned }
  }, [orders])

  const handleStatusChange = async (
    orderId: string,
    newStatus: string
  ) => {
    try {
      await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)

      toast.success('Order status updated')
      fetchOrders()
    } catch {
      toast.error('Failed to update order status')
    }
  }

  const saveTracking = async (orderId: string) => {
    const values = trackingInput[orderId]
    if (!values?.tracking_number) {
      toast.error('Tracking number required')
      return
    }

    try {
      await supabase
        .from('orders')
        .update({
          tracking_number: values.tracking_number,
          carrier: values.carrier,
          status: 'shipped',
        })
        .eq('id', orderId)

      toast.success('Tracking saved')
      fetchOrders()
    } catch {
      toast.error('Failed to save tracking')
    }
  }

  return (
    <>
      <Toaster />
      <div>
        <h1 className="text-3xl font-bold mb-6">Orders</h1>

        {/* ---------- FILTER BAR ---------- */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div>
            <label className="text-xs text-gray-500">Search by Date</label>
            <Input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="w-48"
            />
          </div>

          {selectedDate && (
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => setSelectedDate('')}
              >
                Clear Date
              </Button>
            </div>
          )}
        </div>

        {/* ---------- STATUS SUMMARY ---------- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <StatBox label="Pending" count={stats.pending} />
          <StatBox label="In Transit" count={stats.inTransit} />
          <StatBox label="Delivered" count={stats.delivered} />
          <StatBox label="Cancelled" count={stats.cancelled} />
          <StatBox label="Returned" count={stats.returned} />
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
                {orders.map(order => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>

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
                        onValueChange={value =>
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
                      {order.tracking_number ? (
                        <div className="text-xs">
                          <p>{order.tracking_number}</p>
                          <p className="text-gray-500">{order.carrier}</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <Input
                            placeholder="Tracking #"
                            className="h-7 text-xs"
                            onChange={e =>
                              setTrackingInput(prev => ({
                                ...prev,
                                [order.id]: {
                                  ...prev[order.id],
                                  tracking_number: e.target.value,
                                },
                              }))
                            }
                          />
                          <Input
                            placeholder="Carrier"
                            className="h-7 text-xs"
                            onChange={e =>
                              setTrackingInput(prev => ({
                                ...prev,
                                [order.id]: {
                                  ...prev[order.id],
                                  carrier: e.target.value,
                                },
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full h-7"
                            onClick={() => saveTracking(order.id)}
                          >
                            <Truck className="w-3 h-3 mr-1" />
                            Save
                          </Button>
                        </div>
                      )}
                    </TableCell>

                    <TableCell>
                      {format(
                        new Date(order.created_at),
                        'MMM dd, yyyy'
                      )}
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
    </>
  )
}

/* ---------- SMALL STAT COMPONENT ---------- */
function StatBox({
  label,
  count,
}: {
  label: string
  count: number
}) {
  return (
    <div className="border rounded-lg p-4 bg-white">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{count}</p>
    </div>
  )
}
