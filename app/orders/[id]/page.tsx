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
  Star,
  ArrowLeft
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { WriteReviewModal } from '@/components/WriteReviewModal'
import Link from 'next/link'

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

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [reviewedProductIds, setReviewedProductIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const [reviewModalOpen, setReviewModalOpen] = useState(false)
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null)

  /* ---------------- FETCH ORDER & ITEMS ---------------- */
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrderData = async () => {
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

      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          product_id,
          product:products (
            name
          )
        `)
        .eq('order_id', orderId)

      if (itemsError) console.error('ITEMS ERROR:', itemsError)

      const parsedItems: OrderItem[] = itemsData?.map((i: any) => ({
        product_id: i.product_id,
        product_name: i.product?.name || 'Product',
      })) || []

      setItems(parsedItems)

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
    
    const gold = [212, 175, 55] as [number, number, number]
    
    const logo = new Image()
    logo.src = '/samara-logo.png' 
    logo.onload = () => {
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 0, pageWidth, 40, 'F') 
      doc.addImage(logo, 'PNG', 14, 8, 40, 16)
      doc.setFontSize(14)
      doc.text('TAX INVOICE', pageWidth - margin - 30, 24)

      const sellerY = 55
      doc.setFontSize(10)
      doc.text('Sold By:', margin, sellerY)
      doc.setFont('helvetica', 'bold')
      doc.text('SAMARA', margin, sellerY + 5)
      doc.setFont('helvetica', 'normal')
      doc.text(COMPANY.address, margin, sellerY + 11)
      doc.text(`GSTIN: ${COMPANY.gstin}`, margin, sellerY + 17)
      doc.text(`Email: ${COMPANY.email}`, margin, sellerY + 23)

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

      const billY = 95
      doc.setFontSize(11)
      doc.text('Billing Address', margin, billY)
      doc.setFontSize(10)
      doc.text(order.shipping_name || '', margin, billY + 6)
      doc.text(order.shipping_address || '', margin, billY + 12)
      doc.text(`${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`, margin, billY + 18)
      doc.text(order.shipping_country || '', margin, billY + 24)

      const tableBody = items.map(item => [
        item.product_name,
        '1',
        '-', 
        currency === 'INR' ? '18% GST (Included)' : 'Export – No GST',
        '-'
      ])
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

      doc.setTextColor(100)
      doc.text('This is a computer generated tax invoice.', margin, 277)
      doc.save(`Samara-Invoice-${order.order_number}.pdf`)
    }
    logo.onerror = () => console.error('Failed to load logo.')
  }

  /* ---------------- LOADING STATES ---------------- */
  if (loading) {
    return (
      <div className="min-h-screen bg-samara-void flex items-center justify-center">
        <div className="animate-pulse text-samara-ivory/40 font-sans tracking-widest uppercase text-sm">
          Loading order details...
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-samara-void flex items-center justify-center text-center">
        <div>
          <h2 className="font-serif text-3xl text-samara-gold mb-4">Order Not Found</h2>
          <Link href="/orders" className="text-[11px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold border-b border-samara-ivory/20 hover:border-samara-gold pb-1 transition-colors">
            Back to Orders
          </Link>
        </div>
      </div>
    )
  }

  /* ---------------- STATUS & RETURN LOGIC ---------------- */
  const displayStatus =
    order.payment_status === 'paid' && order.status === 'pending'
      ? 'confirmed'
      : order.status

  const isCancelled = displayStatus === 'cancelled'
  const isDelivered = displayStatus === 'delivered'
  const isShipped = displayStatus === 'shipped'

  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered']
  const stepIndex = isCancelled ? 0 : displayStatus === 'packed' ? 1 : displayStatus === 'shipped' ? 2 : displayStatus === 'delivered' ? 3 : 0

  const referenceDate = order.delivered_at || order.updated_at
  const returnEligible = isDelivered && isWithinReturnWindow(referenceDate)
  const daysLeftToReturn = isDelivered ? getDaysLeftToReturn(referenceDate) : 0
  
  const canCancel = !isCancelled && !isShipped && !isDelivered
  const canReturn = returnEligible && !isCancelled

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

  const statusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'text-samara-gold bg-samara-gold/10';
      case 'shipped': return 'text-blue-400 bg-blue-400/10';
      case 'delivered': return 'text-green-400 bg-green-400/10';
      case 'cancelled': return 'text-red-400 bg-red-400/10';
      case 'return_requested': return 'text-orange-400 bg-orange-400/10';
      default: return 'text-samara-ivory/60 bg-samara-ivory/5';
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="bg-samara-void text-samara-ivory min-h-screen pt-32 pb-24 md:pb-32">
      <div className="container mx-auto px-6 md:px-12 lg:px-16 max-w-4xl">

        {/* BACK LINK */}
        <div className="mb-8">
          <Link href="/orders" className="inline-flex items-center gap-2 text-[10px] font-sans tracking-[0.2em] uppercase text-samara-ivory/60 hover:text-samara-gold transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            All Orders
          </Link>
        </div>

        {/* HEADER */}
        <div className="mb-16 text-center">
          <span className="text-[10px] font-sans tracking-[0.3em] uppercase text-samara-gold mb-4 block">
            Order Details
          </span>
          <h1 className="text-4xl md:text-5xl font-serif text-samara-ivory mb-4">
            Order <em className="italic text-samara-gold">#{order.order_number}</em>
          </h1>
          <p className="text-sm font-sans tracking-wide text-samara-ivory/60">
            Placed on {format(new Date(order.created_at), 'MMMM dd, yyyy')}
          </p>
        </div>

        {/* STATUS + PRICE BAR */}
        <div className="bg-samara-void1 border border-samara-ivory/10 p-6 md:p-8 flex flex-wrap justify-between items-center gap-6 mb-8">
          <div className="flex items-center gap-4">
            <span className={`px-4 py-2 text-[10px] font-sans tracking-[0.2em] uppercase ${statusColor(displayStatus)} capitalize`}>
              {displayStatus}
            </span>
            <span className={`px-4 py-2 text-[10px] font-sans tracking-[0.2em] uppercase ${
              order.payment_status === 'paid' ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'
            } capitalize`}>
              {order.payment_status}
            </span>
          </div>
          <span className="text-2xl md:text-3xl font-serif text-samara-gold">
            {formatPriceSync(order.total_amount, order.currency)}
          </span>
        </div>

        {/* DELIVERY PROGRESS */}
        <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 mb-8">
          <h2 className="text-lg font-serif text-samara-gold mb-10">Delivery Progress</h2>
          <div className="relative flex justify-between items-start">
            {/* Track Line */}
            <div className="absolute top-4 left-[12.5%] right-[12.5%] h-px bg-samara-ivory/10" />
            <div
              className="absolute top-4 left-[12.5%] h-px bg-samara-gold transition-all duration-700"
              style={{ width: `${(stepIndex / 3) * 75}%` }}
            />
            {steps.map((step, i) => {
              const active = i <= stepIndex && !isCancelled
              return (
                <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                  <div className={`w-9 h-9 flex items-center justify-center border transition-all duration-300 ${
                    active
                      ? 'bg-samara-gold border-samara-gold text-samara-void'
                      : 'bg-samara-void border-samara-ivory/20 text-samara-ivory/40'
                  }`}>
                    {i === 0 ? <Package className="w-4 h-4" /> : i === 3 ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                  </div>
                  <span className={`mt-4 text-[10px] font-sans tracking-[0.15em] uppercase ${
                    active ? 'text-samara-gold' : 'text-samara-ivory/40'
                  }`}>{step}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* RATE YOUR PURCHASE */}
        {shouldAskForReview && (
          <div className="bg-samara-void1 border border-samara-gold/20 p-8 md:p-10 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <Star className="w-5 h-5 text-samara-gold fill-samara-gold" />
              <h2 className="text-lg font-serif text-samara-gold">Rate Your Purchase</h2>
            </div>
            
            <div className="space-y-4">
              {items.map(item => {
                const alreadyReviewed = reviewedProductIds.includes(item.product_id)
                if (alreadyReviewed) return null

                return (
                  <div key={item.product_id} className="flex items-center justify-between p-4 border border-samara-ivory/10 bg-samara-void">
                    <span className="text-sm font-serif text-samara-ivory">{item.product_name}</span>
                    <Button
                      size="sm"
                      className="bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[10px] tracking-[0.2em] uppercase h-9 px-6"
                      onClick={() => {
                        setSelectedProductId(item.product_id)
                        setReviewModalOpen(true)
                      }}
                    >
                      Write Review
                    </Button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* TRACKING & SHIPPING */}
        <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12 mb-8">
          <h2 className="text-lg font-serif text-samara-gold mb-8 border-b border-samara-ivory/10 pb-4">Shipping Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <span className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 block mb-2">Tracking Number</span>
              <p className="text-sm font-sans text-samara-ivory">{order.tracking_number || 'Not assigned yet'}</p>
            </div>
            <div>
              <span className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 block mb-2">Carrier</span>
              <p className="text-sm font-sans text-samara-ivory">{order.carrier || 'Will be updated soon'}</p>
            </div>
            <div className="md:col-span-2 mt-4 pt-8 border-t border-samara-ivory/10">
              <span className="text-[10px] font-sans tracking-widest uppercase text-samara-ivory/40 block mb-4">Delivery Address</span>
              <p className="font-serif text-lg text-samara-ivory mb-1">{order.shipping_name}</p>
              <p className="text-sm font-sans text-samara-ivory/80">{order.shipping_address}</p>
              <p className="text-sm font-sans text-samara-ivory/80">{order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}</p>
              <p className="text-sm font-sans text-samara-ivory/80">{order.shipping_country}</p>
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="bg-samara-void1 border border-samara-ivory/10 p-8 md:p-12">
          <div className="flex gap-4 flex-wrap items-center">
            <Button
              onClick={downloadInvoice}
              className="h-12 px-8 bg-samara-gold hover:bg-samara-goldDeep text-samara-void rounded-none font-sans text-[10px] tracking-[0.2em] uppercase transition-colors"
            >
              <Download className="w-4 h-4 mr-3" />
              Download Invoice
            </Button>
            
            {canCancel && (
              <Button
                onClick={cancelOrder}
                className="h-12 px-8 bg-transparent border border-red-500/30 text-red-400 hover:bg-red-500/10 rounded-none font-sans text-[10px] tracking-[0.2em] uppercase transition-colors"
              >
                <XCircle className="w-4 h-4 mr-3" />
                Cancel Order
              </Button>
            )}
            
            {canReturn && (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={requestReturn}
                  className="h-12 px-8 bg-transparent border border-samara-ivory/20 hover:border-samara-gold text-samara-ivory hover:text-samara-gold rounded-none font-sans text-[10px] tracking-[0.2em] uppercase transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-3" />
                  Request Return
                </Button>
                <span className="text-[10px] font-sans tracking-widest text-samara-ivory/40 uppercase text-center">
                  {daysLeftToReturn} days left
                </span>
              </div>
            )}
          </div>

          {isDelivered && !returnEligible && !isCancelled && (
            <p className="text-[10px] font-sans tracking-widest text-samara-ivory/30 uppercase mt-6">
              Return window closed (14 days after delivery).
            </p>
          )}
        </div>

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