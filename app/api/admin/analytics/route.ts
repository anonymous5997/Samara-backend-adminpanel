export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'; 

import {
  getSareeSalesStats,
  getSareeSalesLast30Days,
  getCartVsOrderStatsLast30Days
} from '@/lib/analytics.server';

export async function GET() {
  try {
    const supabase = await createClient();

    const sareeStats = await getSareeSalesStats();
    const chartData = await getSareeSalesLast30Days();
    const conversionData = await getCartVsOrderStatsLast30Days();

    // Fetch all order statuses
    const { data: allOrders } = await supabase
      .from('orders')
      .select('status');

    console.log("RAW ORDER STATUSES:", allOrders?.map((o: any) => o.status));

    const statusCounts = {
      pending: 0,
      shipped: 0,
      delivered: 0,
      returned: 0,
      unknown: 0 // New bucket for unmapped statuses
    };

    // ✅ FIXED: Comprehensive Mapping Logic
    allOrders?.forEach((order: any) => {
      const status = (order.status || '').toLowerCase();

      if (!status) {
        statusCounts.unknown++;
        return;
      }

      // 1. Pending / Processing Group
      if (status.includes('pending') || status.includes('processing') || status.includes('confirmed')) {
        statusCounts.pending++;
        return;
      }

      // 2. Shipped / In Transit Group
      if (status.includes('packed') || status.includes('shipped') || status.includes('out')) {
        statusCounts.shipped++;
        return;
      }

      // 3. Delivered / Completed Group
      // Note: 'paid' is often used as a completed status in simple stores
      if (status.includes('delivered') || status.includes('completed') || status.includes('paid') || status.includes('success')) {
        statusCounts.delivered++;
        return;
      }

      // 4. Returned / Cancelled Group
      if (status.includes('cancel') || status.includes('return') || status.includes('refund')) {
        statusCounts.returned++;
        return;
      }

      // 5. Catch-all for anything else
      statusCounts.unknown++;
    });

    console.log("FINAL MAPPED COUNTS:", statusCounts);

    return NextResponse.json({
      success: true,
      sareeStats,
      chartData,
      conversionData,
      orderStatusStats: statusCounts, 
    });

  } catch (error) {
    console.error('API Analytics Error:', error);

    return NextResponse.json(
      {
        success: false,
        sareeStats: {
          thisMonth: 0,
          lastMonth: 0,
          momChangePercent: 0,
          thisMonthRevenue: 0,
        },
        chartData: [],
        conversionData: {
          addToCart: 0,
          orderPlaced: 0,
          conversionPercent: 0,
        },
        orderStatusStats: {
          pending: 0,
          shipped: 0,
          delivered: 0,
          returned: 0,
          unknown: 0
        }
      },
      { status: 500 }
    );
  }
}