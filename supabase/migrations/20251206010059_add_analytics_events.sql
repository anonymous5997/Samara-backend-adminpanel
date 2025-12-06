/*
  # Add Analytics Events Tracking

  ## Overview
  Add analytics events table to track user behavior:
  - Add to cart events
  - Checkout started events
  - Order placed events

  ## Tables Created
  
  1. **analytics_events** - User behavior tracking
     - `id` (uuid, primary key)
     - `user_id` (uuid, nullable, foreign key to auth.users)
     - `session_id` (text, nullable, for anonymous users)
     - `event_type` (text, CHECK for valid types)
     - `product_id` (uuid, nullable, foreign key to products)
     - `order_id` (uuid, nullable, foreign key to orders)
     - `created_at` (timestamptz, auto-timestamp)

  ## Security
  - Enable RLS for access control
  - Admins can view all events
  - Users can view their own events

  ## Performance
  - Indexes on (event_type, created_at) for fast filtering
  - Indexes on user_id for user-specific queries
  - Indexes on product_id for product analytics
*/

CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  event_type text NOT NULL CHECK (event_type IN ('add_to_cart', 'checkout_started', 'order_placed')),
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  order_id uuid REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Anyone can insert events"
  ON analytics_events FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created 
  ON analytics_events(event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id 
  ON analytics_events(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id 
  ON analytics_events(product_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_order_id 
  ON analytics_events(order_id);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at 
  ON analytics_events(created_at DESC);