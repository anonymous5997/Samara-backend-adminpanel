import { supabase } from './supabase/client';

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

export async function trackAnalyticsEvent(
  eventType: 'add_to_cart' | 'checkout_started' | 'order_placed',
  productId?: string,
  orderId?: string,
  userId?: string,
  sessionId?: string
) {
  try {
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        event_type: eventType,
        product_id: productId,
        order_id: orderId,
        user_id: userId,
        session_id: sessionId,
      });

    if (error) {
      console.error('Error tracking analytics event:', error);
    }
  } catch (error) {
    console.error('Error in trackAnalyticsEvent:', error);
  }
}

export async function getSareeSalesStats(): Promise<SareeSalesStats> {
  try {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    const sareeCategories = await getSareeCategories();
    if (!sareeCategories || sareeCategories.length === 0) {
      return {
        thisMonth: 0,
        lastMonth: 0,
        momChangePercent: 0,
        thisMonthRevenue: 0,
      };
    }

    const categoryIds = sareeCategories.map(c => c.id);

    // Fetch This Month Sales Count
    const { data: thisMonthData } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status), products!inner(category_id)')
      .in('products.category_id', categoryIds)
      .gte('orders.created_at', thisMonthStart.toISOString())
      .eq('orders.payment_status', 'paid');

    // Fetch Last Month Sales Count
    const { data: lastMonthData } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status), products!inner(category_id)')
      .in('products.category_id', categoryIds)
      .gte('orders.created_at', lastMonthStart.toISOString())
      .lte('orders.created_at', lastMonthEnd.toISOString())
      .eq('orders.payment_status', 'paid');

    const thisMonthCount = (thisMonthData || []).reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );

    const lastMonthCount = (lastMonthData || []).reduce(
      (sum: number, item: any) => sum + (item.quantity || 0),
      0
    );

    // Calculate Revenue
    const orderIds = (thisMonthData || []).map((d: any) => d.orders?.id).filter(Boolean);

    let thisMonthRevenue = 0;
    if (orderIds.length > 0) {
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount')
        .in('id', orderIds)
        .eq('payment_status', 'paid');

      thisMonthRevenue = (revenueData || []).reduce(
        (sum: number, order: any) => sum + Number(order.total_amount || 0),
        0
      );
    }

    const momChangePercent = lastMonthCount === 0
      ? thisMonthCount > 0 ? 100 : 0
      : ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100;

    return {
      thisMonth: thisMonthCount,
      lastMonth: lastMonthCount,
      momChangePercent: Math.round(momChangePercent * 10) / 10,
      thisMonthRevenue: Math.round(thisMonthRevenue),
    };
  } catch (error) {
    console.error('Error getting saree sales stats:', error);
    return {
      thisMonth: 0,
      lastMonth: 0,
      momChangePercent: 0,
      thisMonthRevenue: 0,
    };
  }
}

// ✅ FIXED: Explicit YYYY-MM-DD date matching
export async function getSareeSalesLast30Days(): Promise<DailySalesStat[]> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const fromDate = thirtyDaysAgo.toISOString().split('T')[0]; // YYYY-MM-DD

  const { data, error } = await supabase
    .from('saree_sales_daily')
    .select('*')
    .gte('sale_date', fromDate);

  if (error) {
    console.error('Error fetching daily sales:', error);
    return [];
  }

  const map = new Map<string, number>();

  data.forEach((row: any) => {
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
}

export async function getCartVsOrderStatsLast30Days(): Promise<ConversionStat> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { count: addToCartCount, error: cartError } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'add_to_cart')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: orderPlacedCount, error: orderError } = await supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'order_placed')
      .gte('created_at', thirtyDaysAgo.toISOString());

    const addCount = addToCartCount || 0;
    const orderCount = orderPlacedCount || 0;

    const conversionPercent = addCount === 0 ? 0 : (orderCount / addCount) * 100;

    return {
      addToCart: addCount,
      orderPlaced: orderCount,
      conversionPercent: Math.round(conversionPercent * 10) / 10,
    };
  } catch (error) {
    console.error('Error getting conversion stats:', error);
    return {
      addToCart: 0,
      orderPlaced: 0,
      conversionPercent: 0,
    };
  }
}

async function getSareeCategories() {
  try {
    const { data, error } = await supabase
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