'use server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// ---------------- TYPES ----------------

interface SareeSalesStats {
  thisMonth: number;
  lastMonth: number;
  momChangePercent: number;
  thisMonthRevenue: number;
}

interface DailySalesStat {
  date: string;
  sales: number;
}

interface ConversionStat {
  addToCart: number;
  orderPlaced: number;
  conversionPercent: number;
}

// ---------------- SAREE SALES STATS ----------------

export async function getSareeSalesStats(): Promise<SareeSalesStats> {
  try {
    const now = new Date();

    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sareeCategories = await getSareeCategories();

    if (!sareeCategories.length) {
      return { thisMonth: 0, lastMonth: 0, momChangePercent: 0, thisMonthRevenue: 0 };
    }

    const categoryIds = sareeCategories.map(c => c.id);

    // This Month Sales
    const { data: thisMonthData } = await supabaseAdmin
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status), products!inner(category_id)')
      .in('products.category_id', categoryIds)
      .gte('orders.created_at', thisMonthStart.toISOString())
      .eq('orders.payment_status', 'paid');

    // Last Month Sales
    const { data: lastMonthData } = await supabaseAdmin
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status), products!inner(category_id)')
      .in('products.category_id', categoryIds)
      .gte('orders.created_at', lastMonthStart.toISOString())
      .lte('orders.created_at', lastMonthEnd.toISOString())
      .eq('orders.payment_status', 'paid');

    const thisMonthCount = (thisMonthData || []).reduce((sum, item) => sum + (item.quantity || 0), 0);
    const lastMonthCount = (lastMonthData || []).reduce((sum, item) => sum + (item.quantity || 0), 0);

    // ✅ FIXED: Revenue Calculation (Safe Array Access & Typing)
    // We cast 'd' to any to handle the discrepancy between Supabase types (Object) vs Runtime (Array)
    const orderIds: string[] = (thisMonthData || [])
      .map((d: any) => d.orders?.[0]?.id as string | undefined)
      .filter((id): id is string => typeof id === 'string');

    let thisMonthRevenue = 0;

    if (orderIds.length > 0) {
      const uniqueOrderIds = Array.from(new Set(orderIds));


      const { data: revenueData } = await supabaseAdmin
        .from('orders')
        .select('total_amount_inr')
        .in('id', uniqueOrderIds)
        .eq('payment_status', 'paid');

      thisMonthRevenue = (revenueData || []).reduce(
        (sum, order) => sum + Number(order.total_amount_inr || 0), 0
      );
    }

    const momChangePercent =
      lastMonthCount === 0
        ? thisMonthCount > 0 ? 100 : 0
        : ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;

    return {
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
      momChangePercent: Math.round(momChangePercent * 10) / 10,
      thisMonthRevenue: Math.round(thisMonthRevenue),
    };
  } catch (error) {
    console.error('Error getting saree stats:', error);
    return { thisMonth: 0, lastMonth: 0, momChangePercent: 0, thisMonthRevenue: 0 };
  }
}

// ---------------- LAST 30 DAYS SALES ----------------

export async function getSareeSalesLast30Days(): Promise<DailySalesStat[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

    const { data, error } = await supabaseAdmin
      .from('saree_sales_daily')
      .select('*')
      .gte('sale_date', fromDate)
      .order('sale_date', { ascending: true });

    if (error) {
      console.error('Error fetching sales:', error);
      return [];
    }

    const map = new Map<string, number>();
    data.forEach(row => {
      map.set(row.sale_date, Number(row.units_sold));
    });

    const result: DailySalesStat[] = [];

    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const key = d.toISOString().split('T')[0];

      result.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: map.get(key) || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error processing last 30 days:', error);
    return [];
  }
}

// ---------------- CART → ORDER CONVERSION ----------------

export async function getCartVsOrderStatsLast30Days(): Promise<ConversionStat> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Funnel Step 1 = Add to Cart
    const { count: addToCart } = await supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'add_to_cart')
      .gte('created_at', thirtyDaysAgo.toISOString());

    // Funnel Step 2 = Checkout Completed
    const { count: completed } = await supabaseAdmin
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'checkout_completed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const addCount = addToCart || 0;
    const completedCount = completed || 0;

    const conversionPercent = addCount === 0
      ? 0
      : (completedCount / addCount) * 100;

    return {
      addToCart: addCount,
      orderPlaced: completedCount,
      conversionPercent: Math.round(conversionPercent * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting conversion stats:', error);
    return { addToCart: 0, orderPlaced: 0, conversionPercent: 0 };
  }
}

// ---------------- SAREE CATEGORY LOOKUP ----------------

async function getSareeCategories() {
  try {
    const { data } = await supabaseAdmin
      .from('categories')
      .select('id, name')
      .or(`name.ilike.%saree%,slug.ilike.%saree%`)
      .eq('is_active', true);

    return data || [];
  } catch (error) {
    console.error('Error fetching saree categories:', error);
    return [];
  }
}