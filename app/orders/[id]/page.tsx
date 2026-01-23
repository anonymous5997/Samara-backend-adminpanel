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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { WriteReviewModal } from '@/components/WriteReviewModal'

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
      console.log('ORDER ITEMS RAW ===>', itemsData)
      if (itemsError) console.error('ITEMS ERROR:', itemsError)

      const parsedItems: OrderItem[] = itemsData?.map((i: any) => ({
        product_id: i.product_id,
        // Because we used 'product:products', the key here is 'product'
        // We use optional chaining (?.) just in case the join returns null
        product_name: i.product?.name || 'Product',
      })) || []

      // STEP 5 DEBUG: Parsed Data
      console.log('PARSED ITEMS ===>', parsedItems)

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
  if (loading) return <div className="container mx-auto px-4 py-20 text-white">Loading order…</div>
  if (!order) return <div className="container mx-auto px-4 py-20 text-white">Order not found.</div>

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

  // STEP 6 DEBUG: Order Status
  console.log('ORDER STATUS ===>', order.status)

  // STEP 7 DEBUG: Reviewed IDs
  console.log('REVIEWED PRODUCT IDS ===>', reviewedProductIds)

  // STEP 8 DEBUG: Gate Condition
  console.log('SHOULD ASK FOR REVIEW ===>', {
    isDelivered,
    itemsLength: items.length,
    reviewedProductIds,
  })

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
    <div className="container mx-auto px-4 py-12 text-white">
      <Card className="bg-black border border-[#D4AF37]/40">
        <CardHeader className="border-b border-[#D4AF37]/30">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl text-white">Order #{order.order_number}</CardTitle>
              <p className="text-sm text-gray-300 mt-1">{format(new Date(order.created_at), 'MMMM dd, yyyy')}</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold text-white">{formatPriceSync(order.total_amount, order.currency)}</p>
              <div className="flex gap-2 justify-end mt-2 flex-wrap">
                <span className={`px-2 py-1 text-xs rounded capitalize font-medium ${
                  displayStatus === 'cancelled' ? 'bg-red-600' :
                  displayStatus === 'confirmed' ? 'bg-blue-600' :
                  displayStatus === 'shipped' ? 'bg-purple-600' :
                  displayStatus === 'delivered' ? 'bg-green-600' : 'bg-yellow-500 text-black'
                } text-white`}>
                  {displayStatus}
                </span>
                <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">{order.payment_status}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-10 pt-8">
          {/* DELIVERY PROGRESS */}
          <div>
            <p className="font-semibold mb-6 text-white">Delivery Progress</p>
            <div className="relative flex justify-between items-center">
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-700" />
              <div className="absolute top-4 left-0 h-[2px] bg-[#D4AF37]" style={{ width: `${(stepIndex / 3) * 100}%` }} />
              {steps.map((step, i) => {
                const active = i <= stepIndex && !isCancelled
                return (
                  <div key={step} className="relative z-10 flex flex-col items-center flex-1">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${active ? 'bg-[#D4AF37] border-[#D4AF37] text-black' : 'bg-black border-gray-600 text-gray-400'}`}>
                      {i === 0 ? <Package className="w-4 h-4" /> : i === 3 ? <CheckCircle2 className="w-4 h-4" /> : <Truck className="w-4 h-4" />}
                    </div>
                    <span className={`mt-3 text-xs ${active ? 'text-[#D4AF37]' : 'text-gray-400'}`}>{step}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* ✅ RATE YOUR PURCHASE SECTION */}
          {shouldAskForReview && (
            <div className="border border-[#D4AF37]/40 rounded-lg p-5 bg-[#0a0a0a]">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-5 h-5 text-[#D4AF37] fill-[#D4AF37]" />
                <p className="font-semibold text-[#D4AF37]">Rate your purchase</p>
              </div>
              
              <div className="space-y-3">
                {items.map(item => {
                  const alreadyReviewed = reviewedProductIds.includes(item.product_id)
                  if (alreadyReviewed) return null

                  return (
                    <div key={item.product_id} className="flex items-center justify-between bg-white/5 p-3 rounded border border-white/10">
                      <span className="text-sm text-gray-200">{item.product_name}</span>
                      <Button
                        size="sm"
                        className="bg-[#D4AF37] text-black hover:bg-[#b5952f] text-xs h-8"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-400">Tracking Number</p>
              <p className="text-white">{order.tracking_number || 'Not assigned yet'}</p>
            </div>
            <div>
              <p className="text-gray-400">Carrier</p>
              <p className="text-white">{order.carrier || 'Will be updated soon'}</p>
            </div>
            <div className="col-span-1 md:col-span-2">
              <p className="text-gray-400 mb-2">Shipping Address</p>
              <p className="text-white font-medium">{order.shipping_name}</p>
              <p className="text-white">{order.shipping_address}</p>
              <p className="text-white">{order.shipping_city}, {order.shipping_state} – {order.shipping_pincode}</p>
              <p className="text-white">{order.shipping_country}</p>
            </div>
          </div>

          {/* ACTIONS & RETURN WINDOW */}
          <div className="border-t border-gray-800 pt-6">
            <div className="flex gap-4 flex-wrap items-center">
              <Button onClick={downloadInvoice} className="bg-[#D4AF37] text-black hover:bg-[#b5952f]">
                <Download className="w-4 h-4 mr-2" />
                Download Invoice
              </Button>
              
              {canCancel && (
                <Button variant="destructive" onClick={cancelOrder}>
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </Button>
              )}
              
              {/* Return Button */}
              {canReturn && (
                <div className="flex flex-col gap-1">
                  <Button variant="outline" onClick={requestReturn} className="border-gray-600 text-gray-200 hover:bg-gray-800">
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Request Return
                  </Button>
                  <span className="text-[10px] text-gray-500 text-center">
                    {daysLeftToReturn} days left to return
                  </span>
                </div>
              )}
            </div>

            {/* Return Window Closed Message */}
            {isDelivered && !returnEligible && !isCancelled && (
              <p className="text-sm text-gray-500 mt-4 italic">
                Return window closed (14 days after delivery).
              </p>
            )}
          </div>
        </CardContent>
      </Card>

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