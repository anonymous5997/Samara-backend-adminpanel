'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { supabase } from '@/lib/supabase/client'
import { formatPriceSync } from '@/lib/currency-utils'
import { ArrowRight, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AccountHero, FIELD, FOCUS, StatusTag, TEXT_LINK } from '@/components/account/ui'

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

    // ✅ STEP 1: FIX - Query updated to join order_items -> products
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

    // ✅ STEP 2: FIX - Mapping logic updated to access the nested 'products' object
    const mapped: OrderRow[] =
      data?.map((o: any) => {
        // Get the first item from the order
        const item = o.order_items?.[0]
        // Get the product details from that item
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
          // Map product.name to the local state product_name
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

  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink">
        <span className="sm-eyebrow animate-pulse motion-reduce:animate-none">Loading…</span>
      </div>
    )
  }

  return (
    <div className="bg-samara-ink text-samara-ivory">
      <AccountHero
        eyebrow="Account"
        title={<>My <span className="sm-accent">Orders</span></>}
        aside={
          <Link href="/track-order" className={cn(TEXT_LINK, FOCUS, 'text-samara-mute hover:text-samara-ivory')}>
            Track an order
          </Link>
        }
      />

      <div className="sm-container pb-20 pt-10 md:pb-28 md:pt-14">
      <div className="relative max-w-xl">
        <label htmlFor="orders-search" className="sr-only">Search your orders</label>
        <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-samara-mute" strokeWidth={1.25} />
        <input
          id="orders-search"
          type="search"
          className={cn(FIELD, 'pl-11')}
          placeholder="Search your orders"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="mt-12 hidden grid-cols-[72px_minmax(0,1fr)_minmax(0,150px)_180px_120px_44px] gap-x-6 border-b border-samara-line pb-4 lg:grid">
        <span className="sm-eyebrow col-span-2">Order</span>
        <span className="sm-eyebrow">Ref.</span>
        <span className="sm-eyebrow">Status</span>
        <span className="sm-eyebrow text-right">Total</span>
        <span />
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 border-t border-samara-line py-16 lg:mt-0 lg:border-t-0">
          <p className="font-serif text-[2rem] font-light leading-tight text-samara-ivory md:text-[2.5rem]">
            No orders <span className="sm-accent">found</span>
          </p>
          <Link href="/sarees" className={cn(TEXT_LINK, FOCUS, 'mt-6 text-samara-gold hover:text-samara-ivory')}>
            Explore sarees
          </Link>
        </div>
      )}

      <ul className="mt-6 lg:mt-0">
        {filtered.map((order, index) => (
          <li key={order.order_id} className="sm-stagger" style={{ ['--i' as string]: index }}>
          <Link
            href={`/orders/${order.order_id}`}
            className={cn('group grid grid-cols-[64px_minmax(0,1fr)] items-start gap-x-5 border-b border-samara-line py-6 transition-colors duration-300 hover:bg-samara-char/60 sm:grid-cols-[72px_minmax(0,1fr)] lg:grid-cols-[72px_minmax(0,1fr)_minmax(0,150px)_180px_120px_44px] lg:items-center lg:gap-x-6', FOCUS)}
          >
              <div className="relative aspect-[3/4] w-full overflow-hidden bg-samara-char">
                {order.image_url ? (
                  <Image
                    src={order.image_url}
                    alt={order.product_name}
                    width={80}
                    height={120}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-center font-sans text-[0.5rem] uppercase tracking-[0.18em] text-samara-mute">No Image</span>
                )}
              </div>

              <div className="min-w-0">
                <p className="font-sans text-[0.6875rem] tabular-nums tracking-[0.12em] text-samara-mute">
                  Ordered on {new Date(order.created_at).toLocaleDateString()}
                </p>
                <p className="mt-1.5 line-clamp-2 font-serif text-[1.25rem] leading-snug text-samara-ivory transition-colors duration-300 group-hover:text-samara-gold md:text-[1.375rem]">{order.product_name}</p>

                {/* Compact meta below lg */}
                <div className="mt-3 flex flex-wrap items-center gap-2 lg:hidden">
                  <StatusTag tone="gold">{order.order_status}</StatusTag>
                  <StatusTag tone={order.payment_status === 'paid' ? 'ivory' : 'warn'}>{order.payment_status}</StatusTag>
                </div>
                <div className="mt-3 flex items-baseline justify-between gap-4 lg:hidden">
                  <span className="block min-w-0 truncate font-sans text-[0.625rem] uppercase tracking-[0.18em] text-samara-mute">Ref. {order.order_id}</span>
                  <span className="shrink-0 font-sans text-[0.9375rem] tabular-nums text-samara-ivory">{formatPriceSync(order.total_amount, order.currency)}</span>
                </div>
              </div>

              <span className="hidden truncate font-sans text-[0.6875rem] uppercase tracking-[0.14em] text-samara-mute lg:block">{order.order_id}</span>

              <div className="hidden flex-col items-start gap-2 lg:flex">
                <p className="flex items-center gap-2 font-sans text-[0.625rem] uppercase tracking-[0.18em] text-samara-mute">
                  <span className="sr-only">Order: </span>
                  <StatusTag tone="gold">{order.order_status}</StatusTag>
                </p>
                <p className="flex items-center gap-2 font-sans text-[0.625rem] uppercase tracking-[0.18em] text-samara-mute">
                  Payment:{' '}
                  <span
                    className={
                      order.payment_status === 'paid'
                        ? 'text-samara-ivory'
                        : 'text-[#D9806B]'
                    }
                  >
                    {order.payment_status}
                  </span>
                </p>
              </div>

              <div className="hidden text-right font-sans text-[0.9375rem] tabular-nums text-samara-ivory lg:block">
                {formatPriceSync(order.total_amount, order.currency)}
              </div>

              <span aria-hidden className="hidden h-11 w-11 items-center justify-center rounded-full border border-samara-ivory/25 text-samara-ivory transition-colors duration-300 group-hover:border-samara-gold group-hover:bg-samara-gold group-hover:text-samara-cream-ink lg:flex">
                <ArrowRight className="h-4 w-4" strokeWidth={1.25} />
              </span>
          </Link>
          </li>
        ))}
      </ul>
      </div>
    </div>
  )
}