# Analytics Setup - Quick Start Guide

## What's New

Your Samara app now includes comprehensive sales analytics:

✅ **Event Tracking** - Automatically tracks add-to-cart, checkout, and order events
✅ **Saree Sales Dashboard** - Month-to-month sales comparison with trend analysis
✅ **Conversion Analytics** - Cart-to-purchase conversion funnel visualization
✅ **Beautiful Charts** - Line and bar charts showing 30-day trends
✅ **Performance Metrics** - MoM change %, conversion rate, revenue

## Getting Started

### 1. Database Setup (Already Done)

The `analytics_events` table has been created with:
- Automatic event tracking on add-to-cart, checkout, and order placement
- Indexes for fast queries
- Row Level Security for data protection

**Verify it's working:**

Go to Supabase Dashboard → SQL Editor and run:

```sql
SELECT * FROM analytics_events LIMIT 5;
```

If the table exists, you're good to go!

### 2. Create Test Saree Category

The analytics looks for categories with "saree" in the name:

1. Go to **Admin Panel** → **Categories**
2. Click **Add Category**
3. Fill in:
   - Name: `Sarees`
   - Slug: `sarees`
   - Description: `Beautiful traditional sarees`
4. Click **Create Category**

**Why?** Analytics queries for products in categories matching "saree" (case-insensitive).

### 3. Add Test Products to Saree Category

1. Go to **Admin Panel** → **Products**
2. Click **Add Product**
3. Create a product and select the **Sarees** category
4. Add variants (sizes) with stock
5. Save the product

### 4. Test the Event Tracking

Now let's trigger events:

**Test 1: Add to Cart Event**
1. Go to **Shop** page
2. Find the saree product
3. Click **View Details**
4. Click **Add to Cart**
5. ✅ This records an `add_to_cart` event

**Test 2: Checkout Event**
1. Go to **Cart**
2. Click **Proceed to Checkout**
3. ✅ This records a `checkout_started` event

**Test 3: Order Placed Event**
1. Fill in shipping address
2. Click **Place Order**
3. ✅ This records an `order_placed` event

**Verify tracking is working:**

```sql
SELECT event_type, COUNT(*) as count
FROM analytics_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type;
```

You should see counts for each event type.

### 5. View Analytics Dashboard

1. Go to **Admin Panel**
2. Click **Dashboard**
3. Scroll down to see the new analytics sections:

   - **Saree Sales KPI Cards** (4 cards at top)
   - **Saree Sales - Last 30 Days** (Line chart)
   - **Add to Cart vs Orders** (Bar chart with conversion rate)
   - **Analytics Overview** (Quick stats summary)

## Understanding the Dashboard

### Saree Sales Analytics Section

**Cards Displayed:**

| Card | Shows | Example |
|------|-------|---------|
| Sarees Sold - This Month | Total saree units sold this month | 42 |
| Sarees Sold - Last Month | Total saree units sold last month | 38 |
| MoM Change % | Month-over-month growth/decline | +10.5% (green) |
| Saree Revenue - This Month | Total INR from saree sales | ₹84,000 |

**Color Indicators:**
- Green arrow: Sales growing ↑
- Red arrow: Sales declining ↓

### Charts

**Line Chart: Saree Sales Trend**
- Shows daily saree sales for last 30 days
- Helps identify sales patterns and trends
- Hover over points to see exact numbers

**Bar Chart: Conversion Funnel**
- Left bar: Total "Add to Cart" events
- Right bar: Completed orders
- Conversion % shown below

**Example Reading:**
- 100 add-to-cart events
- 12 orders placed
- = 12% conversion rate

## Testing Checklist

- [ ] Saree category created
- [ ] Test product added to Saree category
- [ ] Add to cart event recorded
- [ ] Checkout event recorded
- [ ] Order placed event recorded
- [ ] Admin dashboard shows analytics
- [ ] Charts render without errors
- [ ] Saree stats show correct numbers

## Troubleshooting

### Analytics Show 0 Data

**Problem:** Dashboard shows no sales data

**Solution:**
1. Verify category exists: Check "Sarees" in Admin → Categories
2. Verify products in category: Check Admin → Products (filter by Sarees)
3. Verify paid orders: Only paid orders count. Check order payment_status

**Check:**
```sql
-- Are there paid orders?
SELECT COUNT(*) FROM orders WHERE payment_status = 'paid';

-- Are there saree categories?
SELECT * FROM categories WHERE name ILIKE '%saree%';
```

### Charts Not Showing

**Problem:** Line chart or bar chart shows "No data available"

**Solution:**
1. Ensure you've placed at least one paid order
2. Wait a few seconds and refresh the page
3. Check browser console for errors (F12)

### Conversion Rate Shows Wrong %

**Problem:** Calculation seems off

**Note:**
- Conversion only counts last 30 days
- Data is real-time; refresh for latest
- Only `order_placed` events count as conversions

## Common Questions

**Q: Do I need to manually create categories for each product type?**

A: No! The system searches for categories with "saree" in the name. To track other products:
1. Create categories: "Lehengas", "Suits", etc.
2. Analytics will auto-detect them
3. Create new functions in `lib/analytics.ts` if needed

**Q: How real-time is the data?**

A: Dashboard is updated on page load/refresh. To see latest data:
1. Perform action (add to cart, place order)
2. Refresh admin dashboard

**Q: Why only "paid" orders?**

A: This ensures accuracy. Only completed payments are counted as sales.

**Q: Can I export the analytics?**

A: Yes! Use Supabase Dashboard:
1. Go to SQL Editor
2. Run a query
3. Click "Download as CSV"

**Q: What if I have multiple saree subcategories?**

A: The system auto-detects! Just name them:
- "Traditional Sarees"
- "Designer Sarees"
- "Cotton Sarees"

All will be tracked if they have "saree" in the name.

## Next Steps

1. ✅ Complete the testing checklist above
2. 📊 Place some test orders
3. 📈 Review analytics daily
4. 🎯 Set sales targets based on trends
5. 🔧 Customize categories as needed

## Need Help?

1. Read `ANALYTICS.md` for detailed technical documentation
2. Check `lib/analytics.ts` for the code
3. Review database schema in migrations
4. Check Supabase Dashboard for data verification

## What's Tracked

| Event | When | Data Captured |
|-------|------|---------------|
| `add_to_cart` | User clicks "Add to Cart" | Product ID, User ID |
| `checkout_started` | Checkout page loads | User ID |
| `order_placed` | Order successfully created | Order ID, User ID |

**Automatic Tracking:** You don't need to do anything! Events are recorded automatically.

---

**Status:** ✅ Ready to use
**Last Updated:** December 2024
