'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import {
  formatPriceSync,
  type SupportedCurrency
} from '@/lib/currency-utils'
import {
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Download,
  Star
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { WriteReviewModal } from '@/components/WriteReviewModal'
import { AccountHero, BTN_GHOST, BTN_GOLD, Detail, FOCUS, StatusTag, TEXT_LINK } from '@/components/account/ui'

/* ---------------- CONFIGURATION ---------------- */
const COMPANY = {
  address: '123 Heritage Lane, Silk City, Mumbai - 400001',
  gstin: '27AABCU9603R1ZN',
  email: 'support@samara.com'
}

/* ---------------- TYPES ---------------- */
type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  currency: SupportedCurrency
  created_at: string
  updated_at: string
  delivered_at?: string | null
  tracking_number: string | null
  carrier: string | null
  shipping_name: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  shipping_country: string | null
}

type OrderItem = {
  product_id: string
  product_name: string
}

/* ---------------- HELPER: Return Window ---------------- */
function isWithinReturnWindow(dateString: string | null | undefined) {
  if (!dateString) return false

  const date = new Date(dateString).getTime()
  const now = Date.now()
  const diffInDays = (now - date) / (1000 * 60 * 60 * 24)

  return diffInDays <= 14
}

function getDaysLeftToReturn(dateString: string | null | undefined) {
  if (!dateString) return 0
  const date = new Date(dateString).getTime()
  const now = Date.now()
  const diffInDays = (now - date) / (1000 * 60 * 60 * 24)
  return Math.max(0, Math.floor(14 - diffInDays))
}

export default function OrderDetailsPage() {
  const params = useParams()
  const orderId = typeof params?.id === 'string' ? params.id : null

  // State
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  // Modal State
  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  /* ---------------- FETCH ORDER & ITEMS ---------------- */
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrderData = async () => {
      // 1. Fetch Order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !orderData) {
        setOrder(null)
        setLoading(false)
        return
      }

      setOrder({ ...orderData, currency: orderData.currency as SupportedCurrency })

      // 2. Fetch Order Items (STEP 3 FIX: EXPLICIT ALIAS)
      // We use 'product:products' so the result object has a key named 'product'
      // This is the critical fix for the mapping logic below.
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product:products (
            name
          )
        `)
        .eq('order_id', orderId)

      // STEP 4 DEBUG: Raw Data
      if (itemsError) console.error('ITEMS ERROR:', itemsError)

      const parsedItems: OrderItem[] = itemsData?.map((i: any) => ({
        product_id: i.product_id,
        // Because we used 'product:products', the key here is 'product'
        // We use optional chaining (?.) just in case the join returns null
        product_name: i.product?.name || 'Product',
      })) || []

      // STEP 5 DEBUG: Parsed Data

      setItems(parsedItems)

      // 3. Check Reviews (User Specific)
      const { data: { user } } = await supabase.auth.getUser()
      if (user && parsedItems.length > 0) {
        const { data: reviews } = await supabase
          .from('product_reviews')
          .select('product_id')
          .eq('user_id', user.id)
          .in('product_id', parsedItems.map(i => i.product_id))

        if (reviews) {
          setReviewedProductIds(reviews.map(r => r.product_id))
        }
      }

      setLoading(false)
    }

    fetchOrderData()
  }, [orderId])

  /* ---------------- INVOICE GENERATOR ---------------- */
  const downloadInvoice = async () => {
    if (!order) return
    const currency = order.currency || 'INR'
    const formatted = formatPriceSync(order.total_amount, currency)
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 14
    
    // Colors
    const gold = [212, 175, 55] as [number, number, number]
    
    // Logo
    const logo = new Image()
    logo.src = '/samara-logo.png' 
    logo.onload = () => {
      // Header Bar
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 0, pageWidth, 40, 'F') 
      doc.addImage(logo, 'PNG', 14, 8, 40, 16)
      doc.setFontSize(14)
      doc.text('TAX INVOICE', pageWidth - margin - 30, 24)

      // Seller Info
      const sellerY = 55
      doc.setFontSize(10)
      doc.text('Sold By:', margin, sellerY)
      doc.setFont('helvetica', 'bold')
      doc.text('SAMARA', margin, sellerY + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(COMPANY.address, margin, sellerY + 11)
      doc.text(`GSTIN: ${COMPANY.gstin}`, margin, sellerY + 17)
      doc.text(`Email: ${COMPANY.email}`, margin, sellerY + 23)

      // Invoice Box
      const boxX = pageWidth - margin - 80
      const boxY = 50
      const boxW = 80
      const boxH = 32
      doc.setDrawColor(200, 200, 200)
      doc.rect(boxX, boxY, boxW, boxH)
      
      doc.setFontSize(9)
      doc.setTextColor(100) 
      doc.text(`Invoice #`, boxX + 4, boxY + 8)
      doc.setTextColor(0) 
      doc.setFont('helvetica', 'bold')
      doc.text(order.order_number, boxX + 4, boxY + 14)
      doc.setFont('helvetica', 'normal')

      doc.setTextColor(100)
      doc.text(`Order Date`, boxX + 4, boxY + 22)
      doc.setTextColor(0)
      doc.text(format(new Date(order.created_at), 'dd-MM-yyyy'), boxX + 4, boxY + 28)

      doc.setTextColor(100)
      doc.text(`Currency`, boxX + 50, boxY + 22)
      doc.setTextColor(0)
      doc.text(currency, boxX + 50, boxY + 28)

      // Billing Info
      const billY = 95
      doc.setFontSize(11)
      doc.text('Billing Address', margin, billY)
      doc.setFontSize(10)
      doc.text(order.shipping_name || '', margin, billY + 6)
      doc.text(order.shipping_address || '', margin, billY + 12)
      doc.text(`${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`, margin, billY + 18)
      doc.text(order.shipping_country || '', margin, billY + 24)

      // Dynamic Items for Invoice
      const tableBody = items.map(item => [
        item.product_name,
        '1',
        '-', 
        currency === 'INR' ? '18% GST (Included)' : 'Export – No GST',
        '-'
      ])
      // Fallback if items empty
      if (tableBody.length === 0) {
        tableBody.push(['Samara Premium Saree', '1', formatted, 'Tax Included', formatted])
      }

      autoTable(doc, {
        startY: 125,
        theme: 'grid',
        head: [['Description', 'Qty', 'Price', 'Tax', 'Total']],
        body: tableBody,
        headStyles: {
          fillColor: gold,
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        styles: { fontSize: 10, cellPadding: 3 },
      })

      const y = (doc as any).lastAutoTable.finalY + 10

      // Totals
      const totalBoxW = 85
      const totalBoxX = pageWidth - margin - totalBoxW
      const totalTextX = totalBoxX + 4
      doc.setFillColor(245, 245, 245)
      doc.rect(totalBoxX, y, totalBoxW, 30, 'F')
      
      doc.setFontSize(10)
      doc.text(`Subtotal: ${formatted}`, totalTextX, y + 10)
      doc.text(currency === 'INR' ? 'GST (18%) included' : 'Tax included (0% export)', totalTextX, y + 17)
      
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`Grand Total: ${formatted}`, totalTextX, y + 25)
      
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Price includes applicable taxes and shipping.', totalTextX, y + 36)

      // Footer
      doc.setTextColor(100)
      doc.text('This is a computer generated tax invoice.', margin, 277)
      doc.save(`Samara-Invoice-${order.order_number}.pdf`)
    }
    logo.onerror = () => console.error('Failed to load logo.')
  }

  /* ---------------- LOADING STATES ---------------- */
  if (loading) return <div className="flex min-h-[70vh] items-center justify-center bg-samara-ink"><span className="sm-eyebrow animate-pulse motion-reduce:animate-none">Loading order…</span></div>
  if (!order) return <div className="flex min-h-[70vh] items-center bg-samara-ink"><div className="sm-container py-20"><p className="sm-eyebrow text-samara-gold">My Orders</p><p className="sm-display-m mt-6 font-light">Order not <span className="sm-accent">found.</span></p><Link href="/orders" className="sm-link mt-8 inline-block font-sans text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-samara-ivory hover:text-samara-gold">Back to orders</Link></div></div>

  /* ---------------- STATUS & RETURN LOGIC ---------------- */
  const displayStatus =
    order.payment_status === 'paid' && order.status === 'pending'
      ? 'confirmed'
      : order.status

  const isCancelled = displayStatus === 'cancelled'
  const isDelivered = displayStatus === 'delivered'
  const isShipped = displayStatus === 'shipped'
  const isPaid = order.payment_status === 'paid'

  // Progress Steps
  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered']
  const stepIndex = isCancelled ? 0 : displayStatus === 'packed' ? 1 : displayStatus === 'shipped' ? 2 : displayStatus === 'delivered' ? 3 : 0

  // Reference date for returns (Step 9 Logic)
  const referenceDate = order.delivered_at || order.updated_at
  const returnEligible = isDelivered && isWithinReturnWindow(referenceDate)
  const daysLeftToReturn = isDelivered ? getDaysLeftToReturn(referenceDate) : 0
  
  const canCancel = !isCancelled && !isShipped && !isDelivered
  const canReturn = returnEligible && !isCancelled

  // ✅ REVIEW LOGIC
  const shouldAskForReview = isDelivered && items.some(i => !reviewedProductIds.includes(i.product_id))

  /* ---------------- HANDLERS ---------------- */
  const cancelOrder = async () => {
    await supabase.from('orders').update({ status: 'cancelled' }).eq('id', order.id)
    setOrder({ ...order, status: 'cancelled' })
  }

  const requestReturn = async () => {
    await supabase.from('orders').update({ status: 'return_requested' }).eq('id', order.id)
    setOrder({ ...order, status: 'return_requested' })
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-samara-ink text-samara-ivory">
      <AccountHero
        eyebrow={format(new Date(order.created_at), 'MMMM dd, yyyy')}
        title={<>Order <span className="sm-accent break-all">#{order.order_number}</span></>}
        titleClassName="text-[clamp(2.25rem,5vw,4.5rem)]"
        aside={
          <div className="flex flex-col gap-4 md:items-end">
            <p className="font-serif text-[2rem] font-light leading-none tabular-nums text-samara-ivory md:text-[2.5rem]">{formatPriceSync(order.total_amount, order.currency)}</p>
            <div className="flex flex-wrap gap-2 md:justify-end">
              <StatusTag className={`${
                displayStatus === 'cancelled' ? 'border-[#D9806B]/60 text-[#D9806B]' :
                displayStatus === 'confirmed' ? 'border-samara-ivory/40 text-samara-ivory' :
                displayStatus === 'shipped' ? 'border-samara-gold/60 text-samara-gold' :
                displayStatus === 'delivered' ? 'border-samara-gold bg-samara-gold text-samara-cream-ink' : 'border-samara-ivory/25 text-samara-mute'
              }`}>
                {displayStatus}
              </StatusTag>
              <StatusTag tone="ivory"><span className="sr-only">Payment </span>{order.payment_status}</StatusTag>
            </div>
          </div>
        }
      />

      <div className="sm-container grid grid-cols-1 gap-14 pb-20 pt-12 md:pb-28 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-16 lg:pt-16 xl:grid-cols-[minmax(0,1fr)_420px] xl:gap-24">
        <div className="min-w-0 space-y-14">
          {/* DELIVERY PROGRESS */}
          <section aria-labelledby="order-progress">
            <h2 id="order-progress" className="sm-eyebrow !tracking-[0.28em] text-samara-ivory">Delivery Progress</h2>
            <div className="relative mt-8 flex items-start justify-between">
              <div className="absolute left-[12.5%] right-[12.5%] top-[22px] h-px bg-samara-ivory/20" />
              <div className="absolute left-[12.5%] right-[12.5%] top-[22px] h-px">
                <div className="h-px bg-samara-gold transition-[width] duration-700 ease-editorial" style={{ width: `${(stepIndex / 3) * 100}%` }} />
              </div>
              {steps.map((step, i) => {
                const active = i <= stepIndex && !isCancelled
                return (
                  <div key={step} className="relative z-10 flex flex-1 flex-col items-center text-center">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-full border ${active ? 'border-samara-gold bg-samara-gold text-samara-cream-ink' : 'border-samara-ivory/25 bg-samara-ink text-samara-mute'}`}>
                      {i === 0 ? <Package className="h-4 w-4" strokeWidth={1.25} /> : i === 3 ? <CheckCircle2 className="h-4 w-4" strokeWidth={1.25} /> : <Truck className="h-4 w-4" strokeWidth={1.25} />}
                    </div>
                    <span className={`mt-4 px-1 font-sans text-[0.625rem] font-medium uppercase leading-snug tracking-[0.16em] sm:tracking-[0.2em] ${active ? 'text-samara-gold' : 'text-samara-mute'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </section>

          {/* ✅ RATE YOUR PURCHASE SECTION */}
          {shouldAskForReview && (
            <section className="border border-samara-line bg-samara-char px-6 py-7 sm:px-8">
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-samara-gold" strokeWidth={1.25} />
                <p className="font-serif text-[1.5rem] font-light leading-tight text-samara-ivory">Rate your <span className="sm-accent">purchase</span></p>
              </div>
              
              <div className="mt-5">
                {items.map(item => {
                  const alreadyReviewed = reviewedProductIds.includes(item.product_id)
                  if (alreadyReviewed) return null

                  return (
                    <div key={item.product_id} className="flex flex-wrap items-center justify-between gap-4 border-t border-samara-line py-4">
                      <span className="font-serif text-[1.125rem] text-samara-ivory">{item.product_name}</span>
                      <button
                        type="button"
                        className={cn(BTN_GOLD, 'min-h-[44px] px-5 text-[0.6875rem]')}
                        onClick={() => {
                          setSelectedProductId(item.product_id)
                          setReviewModalOpen(true)
                        }}
                      >
                        Write Review
                      </button>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* PIECES */}
          <section aria-labelledby="order-items">
            <h2 id="order-items" className="sm-eyebrow !tracking-[0.28em] border-b border-samara-line pb-4 text-samara-ivory">Pieces</h2>
            <ul>
              {items.map((item, index) => (
                <li key={`${item.product_id}-${index}`} className="flex items-baseline gap-5 border-b border-samara-line py-5">
                  <span className="font-sans text-[0.6875rem] tabular-nums tracking-[0.18em] text-samara-mute">{String(index + 1).padStart(2, '0')}</span>
                  <span className="font-serif text-[1.25rem] leading-snug text-samara-ivory">{item.product_name}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="h-fit space-y-10 border border-samara-line bg-samara-char px-6 py-8 sm:px-8 sm:py-10 lg:sticky lg:top-[calc(var(--sm-header-h)+2rem)]">
          {/* TRACKING & SHIPPING */}
          <dl className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-1">
            <Detail label="Tracking Number">
              <span className="break-all">{order.tracking_number || 'Not assigned yet'}</span>
            </Detail>
            <Detail label="Carrier">
              {order.carrier || 'Will be updated soon'}
            </Detail>
            <Detail label="Shipping Address" className="sm:col-span-2 lg:col-span-1">
              <span className="block font-serif text-[1.125rem] text-samara-ivory">{order.shipping_name}</span>
              <span className="mt-1 block text-samara-mute">{order.shipping_address}</span>
              <span className="block text-samara-mute">{order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}</span>
              <span className="block text-samara-mute">{order.shipping_country}</span>
            </Detail>
          </dl>

          {/* ACTIONS & RETURN WINDOW */}
          <div className="border-t border-samara-line pt-8">
            <div className="flex flex-col gap-3">
              <button type="button" onClick={downloadInvoice} className={cn(BTN_GOLD, 'w-full')}>
                <Download className="h-4 w-4" strokeWidth={1.25} />
                Download Invoice
              </button>
              
              {canCancel && (
                <button type="button" onClick={cancelOrder} className="sm-btn w-full border-[#D9806B]/50 text-[#D9806B] hover:border-[#D9806B] hover:bg-[#D9806B] hover:text-samara-cream-ink">
                  <XCircle className="h-4 w-4" strokeWidth={1.25} />
                  Cancel Order
                </button>
              )}
              
              {/* Return Button */}
              {canReturn && (
                <div className="flex flex-col gap-2">
                  <button type="button" onClick={requestReturn} className={cn(BTN_GHOST, 'w-full')}>
                    <RotateCcw className="h-4 w-4" strokeWidth={1.25} />
                    Request Return
                  </button>
                  <span className="text-center font-sans text-[0.6875rem] text-samara-mute">
                    {daysLeftToReturn} days left to return
                  </span>
                </div>
              )}
            </div>

            {/* Return Window Closed Message */}
            {isDelivered && !returnEligible && !isCancelled && (
              <p className="mt-5 font-serif text-[1rem] italic text-samara-mute">
                Return window closed (14 days after delivery).
              </p>
            )}
          </div>

          <Link href="/orders" className={cn(TEXT_LINK, FOCUS, 'text-samara-mute hover:text-samara-ivory')}>
            All orders
          </Link>
        </aside>
      </div>

      {/* REVIEW MODAL */}
      {selectedProductId && (
        <WriteReviewModal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          productId={selectedProductId}
        />
      )}
    </div>
  )
}