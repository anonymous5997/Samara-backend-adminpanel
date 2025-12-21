'use client'

import { useEffect, useState } from 'react'
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

  const [trackingInput, setTrackingInput] = useState<{
    [key: string]: { tracking_number: string; carrier: string }
  }>({})

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
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
