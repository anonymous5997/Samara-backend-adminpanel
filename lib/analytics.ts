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

    const { data: thisMonthData, error: thisMonthError } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status)')
      .in('products!inner.category_id', categoryIds)
      .gte('orders.created_at', thisMonthStart.toISOString())
      .eq('orders.payment_status', 'paid');

    const { data: lastMonthData, error: lastMonthError } = await supabase
      .from('order_items')
      .select('quantity, orders!inner(id, payment_status)')
      .in('products!inner.category_id', categoryIds)
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

    const orderIds = (thisMonthData || []).map((d: any) => d.orders?.id).filter(Boolean);

    let thisMonthRevenue = 0;
    if (orderIds.length > 0) {
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total_amount_inr')
        .in('id', orderIds)
        .eq('payment_status', 'paid');

      thisMonthRevenue = (revenueData || []).reduce(
        (sum: number, order: any) => sum + Number(order.total_amount_inr || 0),
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

export async function getSareeSalesLast30Days(): Promise<DailySalesStat[]> {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const sareeCategories = await getSareeCategories();
    if (!sareeCategories || sareeCategories.length === 0) {
      return [];
    }

    const categoryIds = sareeCategories.map(c => c.id);

    const { data, error } = await supabase
      .from('order_items')
      .select(`
        quantity,
        orders!inner(
          id,
          created_at,
          payment_status
        )
      `)
      .in('products!inner.category_id', categoryIds)
      .gte('orders.created_at', thirtyDaysAgo.toISOString())
      .eq('orders.payment_status', 'paid');

    if (error || !data) {
      console.error('Error fetching sales data:', error);
      return [];
    }

    const dailyStats = new Map<string, number>();

    data.forEach((item: any) => {
      const date = new Date(item.orders.created_at);
      const dateStr = date.toISOString().split('T')[0];

      const current = dailyStats.get(dateStr) || 0;
      dailyStats.set(dateStr, current + (item.quantity || 0));
    });

    const result: DailySalesStat[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      result.push({
        date: new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        sales: dailyStats.get(dateStr) || 0,
      });
    }

    return result;
  } catch (error) {
    console.error('Error getting 30-day sales:', error);
    return [];
  }
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
