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
  Download
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

/* ---------------- CONFIGURATION ---------------- */
const COMPANY = {
  address: '123 Heritage Lane, Silk City, Mumbai - 400001',
  gstin: '27AABCU9603R1ZN',
  email: 'support@samara.com'
}

type Order = {
  id: string
  order_number: string
  status: string
  payment_status: string
  total_amount: number
  currency: SupportedCurrency
  created_at: string
  tracking_number: string | null
  carrier: string | null
  shipping_name: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_state: string | null
  shipping_pincode: string | null
  shipping_country: string | null
}

export default function OrderDetailsPage() {
  const params = useParams()
  const orderId = typeof params?.id === 'string' ? params.id : null

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  /* ---------------- FETCH ORDER ---------------- */
  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          payment_status,
          total_amount,
          currency,
          created_at,
          tracking_number,
          carrier,
          shipping_name,
          shipping_address,
          shipping_city,
          shipping_state,
          shipping_pincode,
          shipping_country
        `)
        .eq('id', orderId)
        .single()

      if (!error && data) {
        setOrder({ ...data, currency: data.currency as SupportedCurrency })
      } else {
        setOrder(null)
      }

      setLoading(false)
    }

    fetchOrder()
  }, [orderId])

  /* ---------------- INVOICE GENERATOR ---------------- */
  const downloadInvoice = async () => {
    if (!order) return

    const currency = order.currency || 'INR'
    const formatted = formatPriceSync(order.total_amount, currency)

    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const margin = 14

    /* ---------- COLORS ---------- */
    const gold = [212, 175, 55] as [number, number, number]
    
    /* ---------- LOGO ---------- */
    const logo = new Image()
    logo.src = '/samara-logo.png' 

    logo.onload = () => {
      /* ===== HEADER BAR ===== */
      doc.setFillColor(245, 245, 245)
      doc.rect(0, 0, pageWidth, 40, 'F') 

      // Logo Sizing
      doc.addImage(logo, 'PNG', 14, 8, 40, 16)

      doc.setFontSize(14)
      doc.text('TAX INVOICE', pageWidth - margin - 30, 24)

      /* ===== SELLER BLOCK ===== */
      const sellerY = 55
      doc.setFontSize(10)
      doc.text('Sold By:', margin, sellerY)
      
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'bold')
      doc.text('SAMARA', margin, sellerY + 5)
      
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'normal')
      doc.text(COMPANY.address, margin, sellerY + 11)
      doc.text(`GSTIN: ${COMPANY.gstin}`, margin, sellerY + 17)
      doc.text(`Email: ${COMPANY.email}`, margin, sellerY + 23)

      /* ===== INVOICE BOX (Right) ===== */
      const boxX = pageWidth - margin - 80
      const boxY = 50
      const boxW = 80
      const boxH = 32

      doc.setDrawColor(200, 200, 200)
      doc.rect(boxX, boxY, boxW, boxH)

      // Col 1: Invoice Number & Date
      doc.setFontSize(9)
      doc.setTextColor(100) 
      doc.text(`Invoice #`, boxX + 4, boxY + 8)
      doc.setTextColor(0) 
      
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'bold')
      doc.text(order.order_number, boxX + 4, boxY + 14)
      
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'normal')

      // Row 2
      doc.setTextColor(100)
      doc.text(`Order Date`, boxX + 4, boxY + 22)
      doc.setTextColor(0)
      doc.text(format(new Date(order.created_at), 'dd-MM-yyyy'), boxX + 4, boxY + 28)

      // Col 2: Currency
      doc.setTextColor(100)
      doc.text(`Currency`, boxX + 50, boxY + 22)
      doc.setTextColor(0)
      doc.text(currency, boxX + 50, boxY + 28)

      /* ===== BILLING ===== */
      const billY = 95
      doc.setFontSize(11)
      doc.text('Billing Address', margin, billY)
      doc.setFontSize(10)
      doc.text(order.shipping_name || '', margin, billY + 6)
      doc.text(order.shipping_address || '', margin, billY + 12)
      doc.text(
        `${order.shipping_city}, ${order.shipping_state} - ${order.shipping_pincode}`,
        margin,
        billY + 18
      )
      doc.text(order.shipping_country || '', margin, billY + 24)

      /* ===== ITEMS TABLE ===== */
      autoTable(doc, {
        startY: 125,
        theme: 'grid',
        head: [['Description', 'Qty', 'Price', 'Tax', 'Total']],
        body: [
          [
            'Samara Premium Saree',
            '1',
            formatted,
            currency === 'INR' ? '18% GST (Included)' : 'Export – No GST',
            formatted,
          ],
        ],
        headStyles: {
          fillColor: gold,
          textColor: [0, 0, 0],
          fontStyle: 'bold',
          lineWidth: 0.1,
          lineColor: [200, 200, 200]
        },
        styles: { 
          fontSize: 10,
          cellPadding: 3
        },
      })

      const y = (doc as any).lastAutoTable.finalY + 10

      /* ===== TOTALS BOX ===== */
      const totalBoxW = 85
      const totalBoxX = pageWidth - margin - totalBoxW
      const totalTextX = totalBoxX + 4

      doc.setFillColor(245, 245, 245)
      doc.rect(totalBoxX, y, totalBoxW, 30, 'F')

      doc.setFontSize(10)
      doc.text(`Subtotal: ${formatted}`, totalTextX, y + 10)
      
      doc.text(
        currency === 'INR'
          ? 'GST (18%) included in price'
          : 'Tax included (0% export)',
        totalTextX,
        y + 17
      )

      doc.setFontSize(11)
      
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'bold')
      doc.text(`Grand Total: ${formatted}`, totalTextX, y + 25)

      // Footer Note below totals
      // ✅ FIX: Explicit font family
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('Price includes 18% GST and shipping charges.', totalTextX, y + 36)

      /* ===== FOOTER ===== */
      doc.setTextColor(100)
      doc.text('All prices are inclusive of applicable taxes and shipping charges.', margin, 270)
      doc.text('This is a computer generated tax invoice.', margin, 277)
      doc.text('Thank you for shopping with Samara.', margin, 284)

      doc.save(`Samara-Invoice-${order.order_number}.pdf`)
    }

    logo.onerror = () => {
      console.error('Failed to load logo image.')
    }
  }

  /* ---------------- LOADING STATES ---------------- */
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-20 text-white">
        Loading order…
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-20 text-white">
        Order not found.
      </div>
    )
  }

  /* ---------------- STATUS LOGIC ---------------- */
  const displayStatus =
    order.payment_status === 'paid' && order.status === 'pending'
      ? 'confirmed'
      : order.status

  const isCancelled = displayStatus === 'cancelled'
  const isDelivered = displayStatus === 'delivered'
  const isShipped = displayStatus === 'shipped'
  const isPaid = order.payment_status === 'paid'

  const steps = ['Order Placed', 'Packed', 'Shipped', 'Delivered']
  const stepIndex = isCancelled
    ? 0
    : displayStatus === 'packed'
    ? 1
    : displayStatus === 'shipped'
    ? 2
    : displayStatus === 'delivered'
    ? 3
    : 0

  const canCancel = !isCancelled && !isShipped && !isDelivered
  const canReturn = isDelivered && !isCancelled

  const cancelOrder = async () => {
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order.id)
    setOrder({ ...order, status: 'cancelled' })
  }

  const requestReturn = async () => {
    await supabase
      .from('orders')
      .update({ status: 'return_requested' })
      .eq('id', order.id)
    setOrder({ ...order, status: 'return_requested' })
  }

  /* ---------------- UI ---------------- */
  return (
    <div className="container mx-auto px-4 py-12 text-white">
      <Card className="bg-black border border-[#D4AF37]/40">
        <CardHeader className="border-b border-[#D4AF37]/30">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div>
              <CardTitle className="text-xl text-white">
                Order #{order.order_number}
              </CardTitle>
              <p className="text-sm text-gray-300 mt-1">
                {format(new Date(order.created_at), 'MMMM dd, yyyy')}
              </p>
            </div>

            <div className="text-right">
              <p className="text-lg font-semibold text-white">
                {formatPriceSync(order.total_amount, order.currency)}
              </p>

              <div className="flex gap-2 justify-end mt-2 flex-wrap">
                <span
                  className={`px-2 py-1 text-xs rounded capitalize font-medium
                    ${
                      displayStatus === 'cancelled'
                        ? 'bg-red-600 text-white'
                        : displayStatus === 'confirmed'
                        ? 'bg-blue-600 text-white'
                        : displayStatus === 'shipped'
                        ? 'bg-purple-600 text-white'
                        : displayStatus === 'delivered'
                        ? 'bg-green-600 text-white'
                        : 'bg-yellow-500 text-black'
                    }
                  `}
                >
                  {displayStatus}
                </span>

                <span className="px-2 py-1 text-xs rounded bg-green-600 text-white">
                  {order.payment_status}
                </span>

                {isCancelled && isPaid && (
                  <span className="px-2 py-1 text-xs rounded bg-orange-500 text-black">
                    Refund processing
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-10 pt-8">
          {/* DELIVERY PROGRESS */}
          <div>
            <p className="font-semibold mb-6 text-white">
              Delivery Progress
            </p>

            <div className="relative flex justify-between items-center">
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-gray-700" />

              <div
                className="absolute top-4 left-0 h-[2px] bg-[#D4AF37]"
                style={{ width: `${(stepIndex / 3) * 100}%` }}
              />

              {steps.map((step, i) => {
                const active = i <= stepIndex && !isCancelled

                return (
                  <div
                    key={step}
                    className="relative z-10 flex flex-col items-center flex-1"
                  >
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center border-2 ${
                        active
                          ? 'bg-[#D4AF37] border-[#D4AF37] text-black'
                          : 'bg-black border-gray-600 text-gray-400'
                      }`}
                    >
                      {i === 0 ? (
                        <Package className="w-4 h-4" />
                      ) : i === 3 ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Truck className="w-4 h-4" />
                      )}
                    </div>

                    <span
                      className={`mt-3 text-xs ${
                        active ? 'text-[#D4AF37]' : 'text-gray-400'
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* TRACKING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <p className="text-gray-400">Tracking Number</p>
              <p className="text-white">
                {order.tracking_number || 'Not assigned yet'}
              </p>
            </div>
            <div>
              <p className="text-gray-400">Carrier</p>
              <p className="text-white">
                {order.carrier || 'Will be updated soon'}
              </p>
            </div>
          </div>

          {/* SHIPPING */}
          <div className="text-sm">
            <p className="text-gray-400 mb-2">Shipping Address</p>
            <p className="text-white">{order.shipping_name}</p>
            <p className="text-white">{order.shipping_address}</p>
            <p className="text-white">
              {order.shipping_city}, {order.shipping_state} –{' '}
              {order.shipping_pincode}
            </p>
            <p className="text-white">{order.shipping_country}</p>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4 flex-wrap">
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

            {canReturn && (
              <Button variant="outline" onClick={requestReturn}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Request Return
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}