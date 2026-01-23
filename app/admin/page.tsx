'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic'; 
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { supabase } from '@/lib/supabase/client';
import { 
  Package, 
  ShoppingCart, 
  IndianRupee, 
  Users, 
  TrendingUp, 
  TrendingDown, 
  Filter 
} from 'lucide-react';

// ✅ 1️⃣ DYNAMIC IMPORTS
const AdminSalesChart = dynamic(() => import('@/components/AdminSalesChart'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center bg-gray-50 rounded-lg border border-dashed text-gray-400">
      Loading Real Chart...
    </div>
  )
});

// ✅ New Pie Chart Component
const OrderPieChart = dynamic(() => import('@/components/OrderPieChart'), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center text-gray-400">
      Loading Chart...
    </div>
  )
});

const COLORS = {
  primary: '#2563eb',
  success: '#16a34a',
  warning: '#f59e0b',
  danger: '#ef4444',
  neutral: '#6b7280',
  // Colors: Pending, Shipped, Delivered, Returned, Unknown
  pie: ['#f59e0b', '#3b82f6', '#16a34a', '#ef4444', '#6b7280'],
  noData: '#e5e7eb' 
};

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    totalUsers: 0,
    todayOrders: 0,
  });
  
  const [sareeStats, setSareeStats] = useState({
    thisMonth: 0,
    lastMonth: 0,
    momChangePercent: 0,
    thisMonthRevenue: 0,
  });

  const [chartData, setChartData] = useState<any[]>([]);
  
  const [conversionData, setConversionData] = useState({
    addToCart: 0,
    orderPlaced: 0,
    conversionPercent: 0,
  });

  const [orderStatusStats, setOrderStatusStats] = useState({
    pending: 0,
    shipped: 0,
    delivered: 0,
    returned: 0,
    unknown: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllStats();
  }, []);

  const fetchAllStats = async () => {
    try {
      const { count: productCount } = await supabase.from('products').select('*', { count: 'exact', head: true });
      const { count: orderCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
      const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

      const { data: orders } = await supabase.from('orders').select('total_amount_inr, payment_status');
      const totalRevenue = orders
        ?.filter((order) => order.payment_status === 'paid')
        .reduce((sum, order) => sum + Number(order.total_amount_inr), 0) || 0;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { count: todayOrderCount } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      setStats({
        totalProducts: productCount || 0,
        totalOrders: orderCount || 0,
        totalRevenue,
        totalUsers: userCount || 0,
        todayOrders: todayOrderCount || 0,
      });

      const analyticsRes = await fetch('/api/admin/analytics', { cache: 'no-store' });
      const analytics = await analyticsRes.json();

      console.log("API ANALYTICS RESPONSE:", analytics);
      console.log("ORDER STATUS STATE:", analytics.orderStatusStats);

      if (analytics.success) {
        setSareeStats(analytics.sareeStats);
        setChartData(analytics.chartData);
        setConversionData(analytics.conversionData);
        if (analytics.orderStatusStats) {
          setOrderStatusStats(analytics.orderStatusStats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-gray-500">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-4 bg-gray-300 rounded-full mb-2"></div>
          Loading Analytics...
        </div>
      </div>
    );
  }

  // ✅ FIXED: Data Sanitization
  const pieDataRaw = [
    { name: 'Pending', value: Number(orderStatusStats.pending) || 0 },
    { name: 'Shipped', value: Number(orderStatusStats.shipped) || 0 },
    { name: 'Delivered', value: Number(orderStatusStats.delivered) || 0 },
    { name: 'Returned', value: Number(orderStatusStats.returned) || 0 },
    { name: 'Unknown', value: Number(orderStatusStats.unknown) || 0 }
  ];

  // ✅ FIXED: Logic to map data correctly and check for non-zero existence
  const pieData = pieDataRaw.map(item => ({
    name: item.name,
    value: Number(item.value) || 0
  }));

  const hasRealData = pieData.some(item => item.value > 0);

  // Fallback to show empty chart placeholder if all data is 0
  const safePieData = hasRealData 
    ? pieData 
    : [{ name: 'No Data', value: 1 }];
  
  console.log("FINAL PIE DATA:", safePieData);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">
          Overview of your store's performance and business health.
        </p>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-green-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              ₹{stats.totalRevenue.toLocaleString()}
            </div>
            <p className="text-xs text-green-600 mt-1 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1" />
              Lifetime earnings
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalOrders}</div>
            <p className="text-xs text-gray-500 mt-1">
              <span className="text-blue-600 font-medium">+{stats.todayOrders}</span> new today
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Products</CardTitle>
            <Package className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalProducts}</div>
            <p className="text-xs text-gray-500 mt-1">Active inventory</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-500">Total Users</CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalUsers}</div>
            <p className="text-xs text-gray-500 mt-1">Registered customers</p>
          </CardContent>
        </Card>
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        
        {/* SALES TREND BAR CHART */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Sales Trend</CardTitle>
            <CardDescription>Daily units sold over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[360px] flex flex-col gap-6">
            <div style={{ height: 340 }}>
              {chartData.length > 0 ? (
                <AdminSalesChart data={chartData} />
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 flex-col">
                  <Filter className="w-8 h-8 mb-2 opacity-20" />
                  <p>Data will appear once sales start flowing</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ORDER DISTRIBUTION PIE CHART */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Order Distribution</CardTitle>
            <CardDescription>Overview of order statuses</CardDescription>
          </CardHeader>
          
          {/* ✅ FIXED: Removed explicit height and used flex center for wrapper */}
          <CardContent className="h-[360px] flex justify-center items-center">   
            <OrderPieChart data={safePieData} colors={COLORS.pie} />
          </CardContent>
        </Card>
      </div>

      {/* BOTTOM SECTION */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* CONVERSION FUNNEL */}
        <Card>
          <CardHeader>
            <CardTitle>Conversion Funnel</CardTitle>
            <CardDescription>Customer journey from cart to purchase</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Added to Cart</span>
                <span className="font-bold">{conversionData.addToCart}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-200 w-full" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 font-medium">Order Placed</span>
                <span className="font-bold">{conversionData.orderPlaced}</span>
              </div>
              <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-500" 
                  style={{ width: `${Math.min(100, conversionData.conversionPercent)}%` }}
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-600 uppercase font-bold tracking-wider">Conversion Rate</p>
                <p className="text-xs text-gray-600 mt-1">Orders / Carts</p>
              </div>
              <div className="text-2xl font-bold text-blue-700">
                {Math.min(100, conversionData.conversionPercent).toFixed(1)}%
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MONTHLY PERFORMANCE */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Performance</CardTitle>
            <CardDescription>Current month vs Last month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">This Month Sales</p>
                <p className="text-xl font-bold text-gray-900">{sareeStats.thisMonth} units</p>
                <p className="text-xs text-gray-500 mt-1">
                   ₹{sareeStats.thisMonthRevenue.toLocaleString()} Revenue
                </p>
              </div>

              <div className="p-4 border rounded-lg bg-gray-50">
                <p className="text-xs text-gray-500 mb-1">Last Month Sales</p>
                <p className="text-xl font-bold text-gray-900">{sareeStats.lastMonth} units</p>
              </div>

              <div className="col-span-2 p-4 border rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700">Month-over-Month Growth</p>
                  <p className="text-xs text-gray-500">Comparison with previous period</p>
                </div>
                <div className={`flex items-center text-lg font-bold ${
                  sareeStats.momChangePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {sareeStats.momChangePercent >= 0 ? (
                    <TrendingUp className="w-5 h-5 mr-2" />
                  ) : (
                    <TrendingDown className="w-5 h-5 mr-2" />
                  )}
                  {sareeStats.momChangePercent > 0 ? '+' : ''}
                  {sareeStats.momChangePercent.toFixed(1)}%
                </div>
              </div>

            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}