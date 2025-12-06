# Samara - Full-Stack E-Commerce Platform

A modern, feature-rich e-commerce platform built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Features

### Storefront (Customer-Facing)
- **Home Page**: Hero section, featured products, category navigation
- **Product Catalog**: Browse products with filtering and sorting
- **Product Details**: Image gallery, variants (sizes), multi-currency pricing, AI try-on
- **Shopping Cart**: Add/remove items, quantity management, coupon codes
- **Checkout**: Shipping address form, order summary
- **Wishlist**: Save favorite products
- **User Authentication**: Email OTP login (SMS OTP ready for integration)
- **Multi-Currency**: Support for INR, USD, and AED

### AI Try-On (MVP)
- Camera access using getUserMedia API
- Live camera feed with product overlay
- Modal-based interface for virtual try-on

### Admin Panel
- **Dashboard**: Sales metrics, order statistics, quick actions
- **Product Management**: CRUD operations for products with variants and images
- **Order Management**: View and update order status
- **Category Management**: Create and manage product categories
- **Coupon Management**: Create percentage or flat discount coupons
- **User Management**: View registered users

### Database (Supabase PostgreSQL)
- Normalized schema with proper relationships
- Row Level Security (RLS) policies
- Multi-currency support
- Order tracking with status updates
- Inventory management per variant

## Tech Stack

- **Frontend**: Next.js 13 (App Router), TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui, Radix UI
- **Backend**: Supabase (PostgreSQL, Auth)
- **Authentication**: Supabase Auth with OTP
- **Payment**: Razorpay integration ready
- **State Management**: React Context API

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project

### Installation

1. **Clone and install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:

   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

   # Optional: For Razorpay integration
   NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret

   # Optional: For SMS OTP (future)
   SMS_API_KEY=your_sms_provider_api_key
   SMS_SENDER_ID=your_sender_id
   ```

3. **Database setup**:

   The database migrations have already been applied to your Supabase project. The schema includes:
   - profiles (user profiles with roles)
   - categories (product categories)
   - products (product catalog)
   - product_variants (sizes, colors, stock)
   - product_images (product gallery)
   - orders (customer orders)
   - order_items (order line items)
   - coupons (discount codes)
   - currency_rates (exchange rates)
   - wishlists (saved products)
   - cart_items (shopping cart)

4. **Create an admin user**:

   After signing up through the app, update your user role in Supabase:
   ```sql
   UPDATE profiles
   SET role = 'admin'
   WHERE email = 'your-email@example.com';
   ```

5. **Seed sample data** (Optional):

   You can create a simple script to run the seeder:
   ```typescript
   // scripts/seed.ts
   import { seedDatabase } from '../lib/seed-data';

   seedDatabase().then((result) => {
     console.log('Seeding result:', result);
     process.exit(0);
   });
   ```

6. **Run the development server**:
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
samara/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin panel pages
│   ├── auth/                # Authentication pages
│   ├── cart/                # Shopping cart
│   ├── checkout/            # Checkout flow
│   ├── orders/              # Order history
│   ├── products/            # Product pages
│   ├── profile/             # User profile
│   ├── shop/                # Product catalog
│   └── wishlist/            # Wishlist page
├── components/              # Reusable components
│   ├── ui/                  # shadcn/ui components
│   ├── header.tsx           # Site header
│   ├── footer.tsx           # Site footer
│   └── product-card.tsx     # Product card component
├── lib/                     # Utility functions
│   ├── supabase/            # Supabase clients
│   ├── types/               # TypeScript types
│   ├── auth-context.tsx     # Authentication context
│   ├── cart-context.tsx     # Cart context
│   ├── currency.ts          # Currency utilities
│   └── seed-data.ts         # Database seeder
└── public/                  # Static assets
```

## Key Features Explained

### Authentication
- Email OTP authentication using Supabase Auth
- Automatic profile creation on signup
- Role-based access control (customer/admin)
- Ready for SMS OTP integration

### Multi-Currency Support
- Base currency: INR
- Supported currencies: INR, USD, AED
- Real-time currency conversion
- Exchange rates stored in database

### Shopping Cart
- Server-side cart storage
- Persistent across sessions
- Quantity management
- Variant support

### Order Management
- Order status tracking (pending → confirmed → packed → shipped → delivered)
- Payment status tracking
- Order history for customers
- Admin order management dashboard

### AI Try-On (MVP)
- Uses browser's camera API
- Simple product overlay
- Modal-based interface
- Foundation for advanced AI integration

### Admin Panel
- Secure access (admin role required)
- Product CRUD with variants and images
- Order status updates
- Category management
- Coupon creation and management
- Basic analytics dashboard

## Razorpay Integration (Ready to Implement)

The checkout flow is prepared for Razorpay integration. To complete:

1. Add Razorpay credentials to `.env.local`
2. Create a server action to generate Razorpay orders
3. Add Razorpay checkout script to the checkout page
4. Handle payment success/failure callbacks

## SMS OTP Integration (Ready to Implement)

The authentication flow is designed to support SMS OTP. To implement:

1. Choose an SMS provider (MSG91, Twilio, etc.)
2. Add SMS provider credentials to `.env.local`
3. Create SMS sending utility
4. Update auth flow to support SMS OTP option

## Database Schema Highlights

### Products & Variants
- Products have base information and price
- Variants store size, color, stock, and additional pricing
- Multiple images per product with primary flag

### Orders & Payments
- Orders track currency and exchange rate at time of purchase
- Support for coupons and discounts
- Razorpay integration fields included

### Row Level Security
- Users can only access their own data
- Admin users have full access
- Public access for products and categories

## Development Tips

1. **Testing Authentication**: Use your actual email for testing OTP
2. **Admin Access**: Set your role to 'admin' in the profiles table
3. **Currency Rates**: Update rates in the currency_rates table
4. **Sample Products**: Use the seed script to populate test data

## Production Deployment

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy to Vercel/Netlify/Your hosting**:
   - Set environment variables
   - Connect to Supabase production project
   - Enable proper RLS policies

3. **Post-deployment**:
   - Set up proper domain
   - Configure Razorpay webhooks
   - Set up email templates in Supabase
   - Monitor error logs

## Security Considerations

- RLS policies are enabled on all tables
- User data is protected by authentication checks
- Admin actions require admin role
- Sensitive operations use server-side validation
- Payment processing through Razorpay (PCI compliant)

## Future Enhancements

- Advanced AI try-on with body detection
- SMS OTP authentication
- Product reviews and ratings
- Advanced analytics dashboard
- Inventory alerts
- Automated email notifications
- Product recommendations
- Search functionality with filters
- Social login options

## Support

For issues or questions, please refer to the documentation or create an issue in the repository.

## License

This project is created for educational and demonstration purposes.

---

Built with ❤️ using Next.js, Supabase, and TypeScript
