'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { formatPriceSync } from '@/lib/currency-utils'
import { Package, Search } from 'lucide-react'

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
          products (
            name,
            image_url
          )
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
        const product = item?.products

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
          product_name: product?.name ?? 'Product', 
          image_url: product?.image_url ?? null,
        }
      }) ?? []

    setOrders(mapped)
    setLoading(false)
  }

  const filtered = orders.filter((o) =>
    o.product_name.toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-samara-gold';
      case 'shipped': return 'text-blue-400';
      case 'delivered': return 'text-green-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-samara-ivory/60';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-samara-void flex items-center justify-center">
        <div className="animate-pulse text-samara-ivory/40 font-sans tracking-widest uppercase text-sm">
          Loading orders...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-4xl">
        {/* HEADER */}
        <div className="mb-16 text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Your Account
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-6">
            My <em className="italic text-samara-gold">Orders</em>
          </h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
            Track your purchases and order history
          </p>
        </div>

        {/* SEARCH */}
        <div className="relative mb-12">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-samara-ivory/40" />
          <input
            className="w-full bg-samara-void1 border border-samara-ivory/10 text-samara-ivory placeholder:text-samara-ivory/30 rounded-none h-12 pl-12 pr-4 text-sm font-sans tracking-wide focus:border-samara-gold focus:outline-none transition-colors"
            placeholder="Search your orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-32 bg-samara-void1/50 border border-samara-ivory/10">
            <Package className="w-12 h-12 text-samara-ivory/20 mx-auto mb-6 stroke-[1]" />
            <h3 className="font-serif text-2xl text-samara-gold mb-3">No orders found</h3>
            <p className="text-sm font-sans text-samara-ivory/60 mb-8">
              {search ? 'Try a different search term.' : "You haven't placed any orders yet."}
            </p>
            <Link
              href="/shop"
              className="inline-block text-[11px] font-sans tracking-[0.2em] uppercase text-samara-gold border-b border-samara-gold/30 hover:border-samara-gold pb-1 transition-colors"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filtered.map((order) => (
              <Link
                key={order.order_id}
                href={`/orders/${order.order_id}`}
                className="group block bg-samara-void1 border border-samara-ivory/10 hover:border-samara-gold/30 transition-all duration-300"
              >
                <div className="flex gap-6 p-6">
                  {/* IMAGE */}
                  <div className="w-20 h-28 flex-shrink-0 bg-samara-void overflow-hidden">
                    {order.image_url ? (
                      <Image
                        src={order.image_url}
                        alt={order.product_name}
                        width={80}
                        height={112}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-sans tracking-widest text-samara-ivory/20 uppercase">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* DETAILS */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="font-serif text-lg text-samara-ivory group-hover:text-samara-gold transition-colors truncate">
                        {order.product_name}
                      </h3>
                      <p className="text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/40 mt-1">
                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-6 mt-4">
                      <div>
                        <span className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 block mb-1">Status</span>
                        <span className={`text-sm font-sans tracking-wide capitalize ${statusColor(order.order_status)}`}>
                          {order.order_status}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 block mb-1">Payment</span>
                        <span className={`text-sm font-sans tracking-wide capitalize ${
                          order.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* PRICE */}
                  <div className="flex flex-col items-end justify-center">
                    <span className="text-xl font-serif text-samara-gold">
                      {formatPriceSync(order.total_amount, order.currency)}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}