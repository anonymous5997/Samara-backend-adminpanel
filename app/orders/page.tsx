'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { formatPriceSync } from '@/lib/currency-utils';


type OrderRow = {
  order_id: string
  created_at: string
  order_status: string
  payment_status: string
  total_amount: number
  currency: 'INR' | 'USD' | 'AED' | 'GBP' | 'CAD'
  product_name: string
  image_url: string | null
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  async function fetchOrders() {
    setLoading(true)

    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        status,
        payment_status,
        total_amount,
        currency,
        order_items (
          product_name,
          image_url
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Orders fetch error:', error)
      setLoading(false)
      return
    }

    const mapped: OrderRow[] =
      data?.map((o: any) => {
        const item = o.order_items?.[0]

        return {
          order_id: o.id,
          created_at: o.created_at,
          order_status:
            o.payment_status === 'paid' && o.status === 'pending'
              ? 'confirmed'
              : o.status,
          payment_status: o.payment_status,
          total_amount: o.total_amount,
          currency: o.currency,
          product_name: item?.product_name ?? 'Product',
          image_url: item?.image_url ?? null,
        }
      }) ?? []

    setOrders(mapped)
    setLoading(false)
  }

  const filtered = orders.filter(o =>
    o.product_name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return <div className="p-10 text-center text-white">Loading…</div>
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 text-white">
      <h1 className="text-3xl font-semibold mb-6">My Orders</h1>

      <input
        className="w-full mb-6 rounded-md px-4 py-3 bg-black border border-[#D4AF37] text-white"
        placeholder="Search your orders"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {filtered.length === 0 && (
        <p className="text-gray-400">No orders found</p>
      )}

      <div className="space-y-4">
        {filtered.map(order => (
          <Link
            key={order.order_id}
            href={`/orders/${order.order_id}`}
            className="block bg-black border border-[#D4AF37]/40 rounded-lg p-4 hover:border-[#D4AF37] transition"
          >
            <div className="flex gap-4 items-center">
              <div className="w-20 h-28 bg-gray-800 rounded overflow-hidden flex items-center justify-center text-xs text-gray-400">
                {order.image_url ? (
                  <Image
                    src={order.image_url}
                    alt={order.product_name}
                    width={80}
                    height={120}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  'No Image'
                )}
              </div>

              <div className="flex-1">
                <p className="font-medium text-lg">
                  {order.product_name}
                </p>

                <p className="text-sm text-gray-400">
                  Ordered on{' '}
                  {new Date(order.created_at).toLocaleDateString()}
                </p>

                <p className="text-sm mt-1">
                  Order:{' '}
                  <span className="text-[#D4AF37] capitalize">
                    {order.order_status}
                  </span>
                </p>

                <p className="text-sm">
                  Payment:{' '}
                  <span
                    className={
                      order.payment_status === 'paid'
                        ? 'text-green-400'
                        : 'text-red-400'
                    }
                  >
                    {order.payment_status}
                  </span>
                </p>
              </div>

              <div className="text-lg font-semibold">
                {formatPriceSync(order.total_amount, order.currency)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
