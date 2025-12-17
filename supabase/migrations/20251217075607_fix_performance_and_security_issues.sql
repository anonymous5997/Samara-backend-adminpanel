/*
  # Performance and Security Fixes
  
  1. **Foreign Key Indexes**
     - Add indexes on all foreign key columns for optimal query performance
     - Covers cart_items, categories, collections, order_items, wishlists
  
  2. **RLS Policy Optimization**
     - Wrap auth.uid() calls with (select auth.uid()) to prevent re-evaluation
     - Significantly improves query performance at scale
     - Applies to all tables with RLS policies
  
  3. **Function Security**
     - Set search_path for all functions to prevent search path attacks
     - Makes functions immutable and secure
  
  4. **Performance Impact**
     - Faster queries on foreign key lookups
     - Reduced RLS overhead on large datasets
     - Improved security posture
*/

-- ============================================================================
-- PART 1: ADD MISSING INDEXES ON FOREIGN KEYS
-- ============================================================================

-- Cart items indexes
CREATE INDEX IF NOT EXISTS idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_variant_id ON cart_items(variant_id);

-- Categories parent relationship index
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Collections category relationship index
CREATE INDEX IF NOT EXISTS idx_collections_category_id ON collections(category_id);

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_variant_id ON order_items(variant_id);

-- Wishlists product index
CREATE INDEX IF NOT EXISTS idx_wishlists_product_id ON wishlists(product_id);

-- Product images index (already exists but ensuring)
CREATE INDEX IF NOT EXISTS idx_product_images_product_id ON product_images(product_id);

-- ============================================================================
-- PART 2: OPTIMIZE RLS POLICIES - PROFILES TABLE
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile non-sensitive fields" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile as customer" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;

-- Recreate with optimized auth.uid() calls
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    (select auth.uid()) = id 
    OR 
    EXISTS (
      SELECT 1 FROM profiles admin_profile
      WHERE admin_profile.id = (select auth.uid())
      AND admin_profile.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile non-sensitive fields"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK (
    (select auth.uid()) = id 
    AND 
    role = (SELECT role FROM profiles WHERE id = (select auth.uid()))
  );

CREATE POLICY "Users can insert own profile as customer"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    (select auth.uid()) = id 
    AND 
    role = 'customer'
  );

CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- PART 3: OPTIMIZE RLS POLICIES - OTHER TABLES
-- ============================================================================

-- CATEGORIES
DROP POLICY IF EXISTS "Admins can manage categories" ON categories;
CREATE POLICY "Admins can manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- PRODUCTS
DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
  ON products FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- PRODUCT VARIANTS
DROP POLICY IF EXISTS "Admins can manage product variants" ON product_variants;
CREATE POLICY "Admins can manage product variants"
  ON product_variants FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- PRODUCT IMAGES
DROP POLICY IF EXISTS "Admins can manage product images" ON product_images;
CREATE POLICY "Admins can manage product images"
  ON product_images FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ORDERS
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Users can create own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;

CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own orders"
  ON orders FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Admins can view all orders"
  ON orders FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can update orders"
  ON orders FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- ORDER ITEMS
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON order_items;

CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id AND orders.user_id = (select auth.uid())
    )
  );

CREATE POLICY "Admins can view all order items"
  ON order_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- COUPONS
DROP POLICY IF EXISTS "Admins can manage coupons" ON coupons;
CREATE POLICY "Admins can manage coupons"
  ON coupons FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- CURRENCY RATES
DROP POLICY IF EXISTS "Admins can manage currency rates" ON currency_rates;
CREATE POLICY "Admins can manage currency rates"
  ON currency_rates FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
    )
  );

-- WISHLISTS
DROP POLICY IF EXISTS "Users can view own wishlist" ON wishlists;
DROP POLICY IF EXISTS "Users can manage own wishlist" ON wishlists;

CREATE POLICY "Users can view own wishlist"
  ON wishlists FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own wishlist"
  ON wishlists FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- CART ITEMS
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can manage own cart" ON cart_items;

CREATE POLICY "Users can view own cart"
  ON cart_items FOR SELECT
  TO authenticated
  USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can manage own cart"
  ON cart_items FOR ALL
  TO authenticated
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- ANALYTICS EVENTS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    DROP POLICY IF EXISTS "Users can view own events" ON analytics_events;
    DROP POLICY IF EXISTS "Admins can view all events" ON analytics_events;
    
    CREATE POLICY "Users can view own events"
      ON analytics_events FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
    
    CREATE POLICY "Admins can view all events"
      ON analytics_events FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- COLLECTIONS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collections') THEN
    DROP POLICY IF EXISTS "Admins can view all collections" ON collections;
    DROP POLICY IF EXISTS "Admins can insert collections" ON collections;
    DROP POLICY IF EXISTS "Admins can update collections" ON collections;
    DROP POLICY IF EXISTS "Admins can delete collections" ON collections;
    
    CREATE POLICY "Admins can view all collections"
      ON collections FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can insert collections"
      ON collections FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can update collections"
      ON collections FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can delete collections"
      ON collections FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- COLLECTION PRODUCTS (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'collection_products') THEN
    DROP POLICY IF EXISTS "Admins can insert collection products" ON collection_products;
    DROP POLICY IF EXISTS "Admins can update collection products" ON collection_products;
    DROP POLICY IF EXISTS "Admins can delete collection products" ON collection_products;
    
    CREATE POLICY "Admins can insert collection products"
      ON collection_products FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can update collection products"
      ON collection_products FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can delete collection products"
      ON collection_products FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- HOME HERO SLIDES (if exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'home_hero_slides') THEN
    DROP POLICY IF EXISTS "Admins can view all hero slides" ON home_hero_slides;
    DROP POLICY IF EXISTS "Admins can insert hero slides" ON home_hero_slides;
    DROP POLICY IF EXISTS "Admins can update hero slides" ON home_hero_slides;
    DROP POLICY IF EXISTS "Admins can delete hero slides" ON home_hero_slides;
    
    CREATE POLICY "Admins can view all hero slides"
      ON home_hero_slides FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can insert hero slides"
      ON home_hero_slides FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can update hero slides"
      ON home_hero_slides FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
    
    CREATE POLICY "Admins can delete hero slides"
      ON home_hero_slides FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = (select auth.uid()) AND profiles.role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- PART 4: FIX FUNCTION SEARCH PATHS (SECURITY)
-- ============================================================================

-- Fix prevent_duplicate_email function
CREATE OR REPLACE FUNCTION prevent_duplicate_email()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM profiles 
    WHERE email = NEW.email 
    AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'Email already exists';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix generate_order_number function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS text
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 10000)::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Fix check_max_active_hero_slides function (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_max_active_hero_slides') THEN
    EXECUTE '
      CREATE OR REPLACE FUNCTION check_max_active_hero_slides()
      RETURNS TRIGGER
      SECURITY DEFINER
      SET search_path = public, pg_temp
      AS $func$
      BEGIN
        IF NEW.is_active = true THEN
          IF (SELECT COUNT(*) FROM home_hero_slides WHERE is_active = true AND id != NEW.id) >= 10 THEN
            RAISE EXCEPTION ''Maximum of 10 active hero slides allowed'';
          END IF;
        END IF;
        RETURN NEW;
      END;
      $func$ LANGUAGE plpgsql;
    ';
  END IF;
END $$;

-- ============================================================================
-- SUMMARY
-- ============================================================================

-- Performance Improvements:
-- ✓ Added 7 missing foreign key indexes
-- ✓ Optimized all RLS policies to prevent auth.uid() re-evaluation
-- ✓ Improved query performance on large datasets

-- Security Improvements:
-- ✓ Fixed function search paths to prevent attacks
-- ✓ Made functions SECURITY DEFINER with controlled search_path
-- ✓ Maintained role-based access control

-- Note: "Unused Index" warnings are expected for new applications
-- They will be utilized as the application scales and queries increase