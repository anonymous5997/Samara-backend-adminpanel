# Samara E-Commerce - Quick Setup Guide

## Prerequisites Checklist

- ✅ Node.js 18+ installed
- ✅ Supabase project created
- ✅ Database migrations applied (already done)

## Step-by-Step Setup

### 1. Configure Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For Razorpay (future integration)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

**Where to find Supabase credentials:**
1. Go to your Supabase project dashboard
2. Click on "Settings" → "API"
3. Copy the "Project URL" and "anon/public key"

### 2. Install Dependencies (Already Done)

```bash
npm install
```

### 3. Verify Database Setup

Your database is already set up with all necessary tables:
- profiles, categories, products, product_variants, product_images
- orders, order_items, cart_items, wishlists
- coupons, currency_rates

Check in Supabase Dashboard → Table Editor to verify.

### 4. Create Your Admin Account

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Sign up through the app:**
   - Go to http://localhost:3000
   - Click "Sign In" in the header
   - Enter your email
   - Check your email for the OTP code
   - Enter the code to complete signup

3. **Grant yourself admin access:**

   Go to Supabase Dashboard → SQL Editor and run:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

4. **Verify admin access:**
   - Refresh the page
   - You should now see "Admin Panel" in the user menu

### 5. Add Sample Data (Optional)

You can add sample data manually through the admin panel or run a seed script.

**Manual approach:**
1. Go to http://localhost:3000/admin
2. Add Categories (e.g., Men, Women, Accessories)
3. Add Products with variants (sizes) and images
4. Create Coupons for testing

**Quick categories to add:**
- Men (slug: men)
- Women (slug: women)
- Kids (slug: kids)
- Accessories (slug: accessories)
- Footwear (slug: footwear)

**Sample product:**
- Name: Classic Cotton T-Shirt
- Slug: classic-cotton-tshirt
- Brand: Samara Basics
- Base Price: 799 INR
- Variants: S, M, L, XL (stock: 10 each)
- Image: Use any URL from images.pexels.com

### 6. Test the Application

**Customer Flow:**
1. Browse products: http://localhost:3000/shop
2. View product details
3. Try the AI Try-On feature
4. Add items to cart
5. Apply coupon code (e.g., WELCOME10)
6. Complete checkout

**Admin Flow:**
1. Access admin panel: http://localhost:3000/admin
2. View dashboard with stats
3. Manage products, orders, categories, coupons
4. Update order status

### 7. Currency Testing

The app supports three currencies:
- INR (Indian Rupee) - Base currency
- USD (US Dollar)
- AED (UAE Dirham)

Exchange rates are stored in the `currency_rates` table and can be updated.

### 8. Authentication Testing

**Email OTP:**
- Works out of the box with Supabase
- Check your email inbox for OTP codes
- OTP codes are valid for a short time

**SMS OTP (Future):**
- Currently shows "SMS OTP coming soon" message
- Ready for integration with MSG91/Twilio
- See README.md for implementation guide

## Common Issues & Solutions

### Issue: Can't access admin panel
**Solution:** Make sure your profile role is set to 'admin' in the database.

### Issue: Images not loading
**Solution:**
- Check that image URLs are valid
- For Pexels images, use format: `https://images.pexels.com/photos/[id]/pexels-photo-[id].jpeg`
- Image URLs should be HTTPS

### Issue: OTP email not received
**Solution:**
- Check spam folder
- Verify email in Supabase Dashboard → Authentication → Users
- Check Supabase email settings

### Issue: Build errors
**Solution:**
- Run `npm install` to ensure all dependencies are installed
- Check that all environment variables are set
- Clear `.next` folder and rebuild: `rm -rf .next && npm run build`

## Production Deployment

### Pre-deployment Checklist

1. **Environment Variables:**
   - Set all required env vars in your hosting platform
   - Use production Supabase project
   - Add Razorpay credentials (if using)

2. **Database:**
   - Run migrations on production Supabase
   - Verify RLS policies are active
   - Set up admin users

3. **Build:**
   ```bash
   npm run build
   ```

4. **Test:**
   - Test all user flows
   - Verify admin panel access
   - Test payment flow (if integrated)

### Recommended Hosting

- **Vercel** (Recommended): Native Next.js support
- **Netlify**: Good Next.js support
- **Your own server**: Requires Node.js runtime

### Post-deployment

1. **Configure domain** in your hosting platform
2. **Set up Razorpay webhooks** (when implemented)
3. **Configure email templates** in Supabase
4. **Monitor error logs** in hosting dashboard
5. **Set up analytics** (optional)

## Development Tips

### Hot Reload
Changes to code will automatically reload the browser in development mode.

### Database Changes
When modifying the database schema:
1. Make changes in Supabase Dashboard or via migrations
2. Update TypeScript types in `lib/types/index.ts`
3. Update any affected queries

### Adding New Features
1. Create new pages in `app/` directory
2. Use existing components from `components/ui/`
3. Follow the established patterns for API calls
4. Add proper RLS policies for new tables

### Testing Payments
For Razorpay testing:
1. Use test mode keys
2. Test cards: 4111 1111 1111 1111
3. Any future expiry date
4. Any CVV

## Support Resources

- **Next.js Docs**: https://nextjs.org/docs
- **Supabase Docs**: https://supabase.com/docs
- **Tailwind CSS**: https://tailwindcss.com/docs
- **shadcn/ui**: https://ui.shadcn.com

## Next Steps

1. ✅ Complete this setup
2. 🎨 Customize branding and colors
3. 📦 Add your products
4. 💳 Integrate Razorpay
5. 📱 Test on mobile devices
6. 🚀 Deploy to production
7. 📧 Set up email notifications
8. 📊 Add analytics
9. 🔧 Implement SMS OTP
10. 🤖 Enhance AI try-on feature

## Success Indicators

Your setup is complete when you can:
- ✅ Sign in with email OTP
- ✅ Browse products as a customer
- ✅ Add items to cart and checkout
- ✅ Access admin panel
- ✅ Create and manage products
- ✅ View orders in admin panel
- ✅ Apply coupon codes
- ✅ Use AI try-on feature
- ✅ Switch currencies

**Congratulations! Your Samara e-commerce platform is ready to use!** 🎉
