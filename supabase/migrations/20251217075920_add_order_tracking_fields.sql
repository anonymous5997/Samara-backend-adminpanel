/*
  # Add Order Tracking Fields
  
  1. **New Columns**
     - tracking_number: Shipment tracking number
     - carrier: Shipping carrier name (FedEx, UPS, DHL, etc.)
  
  2. **Purpose**
     - Allow admins to add tracking information to orders
     - Customers can track their shipments
     - Improve order management workflow
*/

-- Add tracking fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_number text,
ADD COLUMN IF NOT EXISTS carrier text;

-- Add index for tracking number lookups
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.tracking_number IS 'Shipment tracking number provided by carrier';
COMMENT ON COLUMN orders.carrier IS 'Shipping carrier name (e.g., FedEx, UPS, DHL, India Post)';