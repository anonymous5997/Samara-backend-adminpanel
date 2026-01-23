'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Eye, Search } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner' // Assuming you have sonner installed, otherwise use alert

/* ---------------- STATUS CONFIGURATION ---------------- */
const STATUS_CONFIG: Record<
  string,
  {
    dbStatuses: string[]
    allowShip: boolean
    allowDeliver: boolean
  }
> = {
  pending: {
    dbStatuses: ['pending'],
    allowShip: true,
    allowDeliver: false,
  },
  'in-transit': {
    dbStatuses: ['packed', 'shipped'],
    allowShip: false,
    allowDeliver: true,
  },
  delivered: {
    dbStatuses: ['delivered'],
    allowShip: false,
    allowDeliver: false,
  },
  cancelled: {
    dbStatuses: ['cancelled'],
    allowShip: false,
    allowDeliver: false,
  },
  returned: {
    dbStatuses: ['returned'],
    allowShip: false,
    allowDeliver: false,
  },
}

export default function OrdersByStatusPage() {
  const { status } = useParams()
  
  // State
  const [orders, setOrders] = useState<any[]>([])
  const [filteredOrders, setFilteredOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  
  // Tracking Input State
  const [trackingInput, setTrackingInput] = useState<{
    [key: string]: { tracking_number: string; carrier: string }
  }>({})

  // Current Config based on URL param
  const currentConfig = STATUS_CONFIG[String(status)]

  /* ---------------- FETCH ORDERS ---------------- */
  useEffect(() => {
    fetchOrders()
  }, [status])

  const fetchOrders = async () => {
    if (!currentConfig) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .in('status', currentConfig.dbStatuses)
      .order('created_at', { ascending: false })

    if (!error) {
      setOrders(data || [])
      setFilteredOrders(data || [])
    }
    setLoading(false)
  }

  /* ---------------- SEARCH & FILTER LOGIC ---------------- */
  useEffect(() => {
    let result = [...orders]

    // Text Search
    if (search) {
      result = result.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.shipping_name?.toLowerCase().includes(search.toLowerCase())
      )
    }

    // Date Filter
    if (selectedDate) {
      const start = new Date(selectedDate)
      start.setHours(0, 0, 0, 0)

      const end = new Date(selectedDate)
      end.setHours(23, 59, 59, 999)

      result = result.filter(o => {
        const created = new Date(o.created_at)
        return created >= start && created <= end
      })
    }

    setFilteredOrders(result)
  }, [search, selectedDate, orders])

  /* ---------------- ACTION HANDLERS ---------------- */
  const markAsShipped = async (orderId: string) => {
    const values = trackingInput[orderId]

    if (!values?.tracking_number || !values?.carrier) {
      toast.error('Tracking number and carrier required')
      return
    }

    const { error } = await supabase
      .from('orders')
      .update({
        tracking_number: values.tracking_number,
        carrier: values.carrier,
        status: 'shipped',
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update order')
    } else {
      toast.success('Order marked as shipped')
      // Remove from view since status changed
      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
  }

  const markAsDelivered = async (orderId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (error) {
      toast.error('Failed to update order')
    } else {
      toast.success('Order marked as delivered')
      // Remove from view since status changed
      setOrders(prev => prev.filter(o => o.id !== orderId))
    }
  }

  /* ---------------- RENDER ---------------- */
  if (loading) return <div className="p-6">Loading orders…</div>
  if (!currentConfig) return <div className="p-6">Invalid Status Page</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold capitalize">
          {String(status).replace('-', ' ')} Orders
        </h1>
        <span className="text-sm text-gray-500">{filteredOrders.length} orders found</span>
      </div>

      {/* SEARCH & FILTER BAR */}
      <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg border">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search Order ID or Customer..."
            className="pl-9 w-72"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <Input
          type="date"
          className="w-auto"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        />

        {selectedDate && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate('')}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            Clear Date
          </Button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[300px]">Actions / Tracking</TableHead>
              <TableHead>Date</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                  No orders found.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-gray-50">
                  <TableCell className="font-medium">
                    {order.order_number}
                  </TableCell>

                  <TableCell>
                    <p className="font-medium">{order.shipping_name}</p>
                    <p className="text-xs text-gray-500">{order.shipping_phone}</p>
                  </TableCell>

                  <TableCell className="capitalize">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </TableCell>

                  <TableCell>
                    {/* Allow Ship: Show Inputs */}
                    {currentConfig.allowShip && (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Tracking #"
                            className="h-8 text-xs"
                            value={trackingInput[order.id]?.tracking_number || ''}
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
                            className="h-8 text-xs"
                            value={trackingInput[order.id]?.carrier || ''}
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
                        </div>
                        <Button
                          onClick={() => markAsShipped(order.id)}
                          size="sm"
                          className="w-full h-7 text-xs bg-black hover:bg-gray-800"
                        >
                          Mark as Shipped
                        </Button>
                      </div>
                    )}

                    {/* Allow Deliver: Show Button */}
                    {currentConfig.allowDeliver && (
                      <Button
                        onClick={() => markAsDelivered(order.id)}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white w-full h-8"
                      >
                        Mark Delivered
                      </Button>
                    )}

                    {/* View Only: Show Info */}
                    {!currentConfig.allowShip && !currentConfig.allowDeliver && (
                      <div className="text-sm text-gray-600">
                        {order.tracking_number ? (
                          <>
                            <p className="font-medium">{order.tracking_number}</p>
                            <p className="text-xs">{order.carrier}</p>
                          </>
                        ) : (
                          <span className="text-gray-400 italic">No tracking info</span>
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}