# Samara Analytics - Implementation Guide

## Overview

The Samara e-commerce platform now includes comprehensive analytics tracking for understanding customer behavior and sales performance, specifically focused on saree sales and cart-to-purchase conversion metrics.

## What Was Added

### 1. Analytics Events Database

A new `analytics_events` table tracks user interactions:

```sql
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY,
  user_id uuid,           -- Reference to auth user
  session_id text,        -- For anonymous users
  event_type text,        -- 'add_to_cart', 'checkout_started', 'order_placed'
  product_id uuid,        -- Which product
  order_id uuid,          -- Which order (for order events)
  created_at timestamptz  -- When it happened
);
```

**Indexes Added:**
- `(event_type, created_at DESC)` - Fast event type filtering
- `(user_id, created_at DESC)` - User-specific analytics
- `(product_id)` - Product performance tracking
- `(order_id)` - Order relationship tracking
- `(created_at DESC)` - Time-based queries

### 2. Event Tracking Implementation

#### Add to Cart Events
**Location:** `lib/cart-context.tsx`

When users click "Add to Cart":
```typescript
await trackAnalyticsEvent('add_to_cart', productId, undefined, user.id);
```

#### Checkout Started Events
**Location:** `app/checkout/page.tsx`

When checkout page loads:
```typescript
await trackAnalyticsEvent('checkout_started', undefined, undefined, user.id);
```

#### Order Placed Events
**Location:** `app/checkout/page.tsx`

When order is successfully created:
```typescript
await trackAnalyticsEvent('order_placed', undefined, order.id, user.id);
```

### 3. Analytics Helper Functions

**Location:** `lib/analytics.ts`

#### `getSareeSalesStats()`
Returns saree sales for current and previous month:
```typescript
interface SareeSalesStats {
  thisMonth: number;        // Units sold this month
  lastMonth: number;        // Units sold last month
  momChangePercent: number; // Month-over-month % change
  thisMonthRevenue: number; // Revenue from sarees this month (INR)
}
```

**Logic:**
1. Finds all categories with "saree" in name or slug
2. Queries order_items for sarees in current month
3. Queries order_items for sarees in previous month
4. Filters for paid orders only
5. Calculates percentage change and revenue

#### `getSareeSalesLast30Days()`
Returns daily saree sales for the last 30 days:
```typescript
interface DailySalesStat {
  date: string;  // "Jan 01"
  sales: number; // Units sold that day
}
```

**Logic:**
1. Queries last 30 days of order_items for sarees
2. Groups by date
3. Returns array of daily stats with formatted dates

#### `getCartVsOrderStatsLast30Days()`
Returns conversion metrics:
```typescript
interface ConversionStat {
  addToCart: number;        // Total add-to-cart events
  orderPlaced: number;      // Total order_placed events
  conversionPercent: number; // (orderPlaced / addToCart) * 100
}
```

**Logic:**
1. Counts 'add_to_cart' events in last 30 days
2. Counts 'order_placed' events in last 30 days
3. Calculates conversion percentage
4. Handles zero cases gracefully

### 4. Admin Dashboard Analytics

**Location:** `app/admin/page.tsx`

The admin dashboard now displays:

#### Saree Sales KPI Cards (Row 1)
1. **Sarees Sold - This Month** (blue icon)
2. **Sarees Sold - Last Month** (gray icon)
3. **MoM Change %** (green up/red down arrow)
4. **Saree Revenue - This Month** (green icon)

#### Charts Section (Row 2)

**Left Chart: Line Chart - 30 Day Saree Sales Trend**
- X-axis: Last 30 days (formatted dates)
- Y-axis: Units sold per day
- Blue line with dot markers
- Tooltip on hover

**Right Chart: Bar Chart - Add to Cart vs Orders**
- Two bars: "Add to Cart" and "Orders"
- Blue fill color
- Shows conversion statistics below
- Includes conversion percentage in highlighted box

#### Analytics Overview (Row 3)
Quick summary statistics:
- Avg Daily Saree Sales
- Conversion Rate (%)
- Total Add to Cart (30 days)
- Total Orders (30 days)

### 5. Database Query Patterns

#### Finding Saree Categories
```sql
SELECT * FROM categories
WHERE (name ILIKE '%saree%' OR slug ILIKE '%saree%')
AND is_active = true;
```

#### Aggregating Order Items by Category
```sql
SELECT SUM(order_items.quantity) as total
FROM order_items
JOIN products ON order_items.product_id = products.id
WHERE products.category_id IN (saree_category_ids)
AND orders.created_at BETWEEN month_start AND month_end
AND orders.payment_status = 'paid';
```

#### Grouping Sales by Date
```sql
SELECT DATE(orders.created_at) as date, SUM(order_items.quantity) as sales
FROM order_items
JOIN orders ON order_items.order_id = orders.id
WHERE DATE(orders.created_at) >= thirty_days_ago
AND orders.payment_status = 'paid'
GROUP BY DATE(orders.created_at);
```

## How to Use the Analytics

### For Admins

1. **Access Dashboard:** Navigate to `/admin`
2. **View Saree KPIs:** Top cards show immediate metrics
3. **Analyze Trends:** Line chart shows 30-day sales pattern
4. **Monitor Conversion:** Bar chart shows cart vs purchase funnel
5. **Quick Stats:** Overview card shows key metrics at a glance

### Interpreting Metrics

#### MoM Change %
- **Green arrow + positive %:** Sales growing month-over-month
- **Red arrow + negative %:** Sales declining month-over-month
- **Example:** +15.5% means this month sold 15.5% more than last month

#### Conversion Rate
- **Formula:** (Orders / Add to Cart) × 100
- **Interpretation:** What % of cart sessions resulted in purchases
- **Example:** 12.3% means 12.3 out of every 100 add-to-cart events led to orders

### Data Accuracy Notes

**Paid Orders Only:**
- Revenue calculations only include orders with `payment_status = 'paid'`
- This ensures accuracy of actual revenue

**Category Matching:**
- Categories are matched by name or slug containing "saree" (case-insensitive)
- Customize this in `getSareeCategories()` function

**Time Zones:**
- All dates use UTC (`timestamptz`)
- Adjust frontend display as needed for your timezone

**Real-time Updates:**
- Dashboard doesn't auto-refresh
- Refresh page to see latest data

## Performance Considerations

### Query Optimization

All analytics queries are optimized with:

1. **Indexes:** Pre-computed indexes on frequently queried columns
2. **Date Filters:** Time-based WHERE clauses to limit scan
3. **Aggregation:** Database-level grouping instead of app-level
4. **Selective Joins:** Only joining necessary tables

### Typical Query Times

- Saree stats: < 100ms
- 30-day trends: < 200ms
- Conversion stats: < 50ms

### Scaling Considerations

For high-traffic stores (1M+ orders):

1. **Archive old data:** Move orders older than 1 year to archive table
2. **Materialized views:** Pre-compute daily stats
3. **Caching:** Cache dashboard data for 5-10 minutes
4. **Separate analytics DB:** Consider read-only analytics replica

## Adding More Product Categories

To track analytics for other product types (e.g., lehengas, suits):

1. **Option 1 - Create new function:**
```typescript
export async function getLehengaSalesStats() {
  // Copy getSareeSalesStats logic
  // Change category filter: "lehenga"
}
```

2. **Option 2 - Generalize function:**
```typescript
export async function getCategorySalesStats(categoryKeyword: string) {
  // Use categoryKeyword to filter categories
  // Returns stats for that category
}
```

3. **Add to admin dashboard:**
```typescript
const lehengaStats = await getCategorySalesStats('lehenga');
// Display in separate section
```

## Common Queries

### Q: How do I check if tracking is working?

A: Query the analytics_events table directly:

```sql
SELECT event_type, COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_type;
```

### Q: How do I export the analytics data?

A: Use Supabase CLI or API:

```bash
supabase db pull  # Download data as CSV
# Or query and export via Supabase dashboard
```

### Q: Can I track anonymous users?

A: Yes! The `session_id` field is designed for this:

```typescript
trackAnalyticsEvent('add_to_cart', productId, undefined, null, sessionId);
```

### Q: How often should I review analytics?

A: Recommended review frequency:
- **Daily:** Check yesterday's conversion rate
- **Weekly:** Review trend for past 7 days
- **Monthly:** Analyze MoM changes

## Troubleshooting

### Issue: Analytics showing 0 data

**Check:**
1. Have events been triggered? (Check analytics_events table count)
2. Are orders marked as `payment_status = 'paid'`?
3. Do saree categories exist with correct naming?

**Fix:**
```sql
-- Verify categories exist
SELECT * FROM categories WHERE name ILIKE '%saree%';

-- Verify events are being recorded
SELECT * FROM analytics_events LIMIT 10;

-- Check order payment status
SELECT payment_status, COUNT(*) FROM orders GROUP BY payment_status;
```

### Issue: Charts not rendering

**Check:**
1. Is recharts library installed? (Included in package.json)
2. Is analytics data being fetched? (Check browser console)
3. Are there TypeScript errors? (Check build output)

**Fix:**
- Verify recharts components are imported correctly
- Check if data arrays are empty (should show "No data available")

### Issue: Performance is slow

**Check:**
1. Database indexes exist? (Run migration again)
2. Query filters working? (Check WHERE clauses)
3. Too much historical data? (Consider archiving)

**Fix:**
- Add time-based WHERE clauses
- Limit 30-day queries to exact date ranges
- Archive orders older than 6 months

## Future Enhancements

1. **Auto-refresh:** Add periodic updates every 5 minutes
2. **Drill-down:** Click on date to see daily breakdown
3. **Comparisons:** Compare this month vs previous months
4. **Predictions:** ML model to forecast sales trends
5. **Custom date ranges:** Choose any date range for analysis
6. **Export reports:** Generate PDF reports
7. **Alerts:** Notify admin of low conversion rates
8. **Cohort analysis:** Track customer segments
9. **Product-level analytics:** Individual product performance
10. **User journey:** Track complete path from browse to purchase

## Technical Details

### Database Transactions
- Analytics events are recorded asynchronously
- Failed tracking doesn't affect user experience
- Events may arrive slightly out of order (millisecond differences)

### Data Retention
- No automatic data deletion
- Keep all historical data for trend analysis
- Archive to separate table if storage becomes an issue

### Privacy Considerations
- `user_id` is used for authenticated users
- `session_id` used for anonymous tracking
- RLS policies restrict access to own data for customers
- Admins can view all analytics events

## Support

For issues or questions:
1. Check this documentation
2. Review the code in `lib/analytics.ts`
3. Examine database schema in migrations
4. Check browser console for client-side errors
5. Review Supabase logs for database errors

---

**Created:** December 2024
**Analytics Version:** 1.0
**Last Updated:** December 2024
