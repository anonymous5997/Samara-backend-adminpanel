-- Add Shiprocket Integration Fields
-- Add shiprocket_order_id and shiprocket_shipment_id columns to orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_order_id text;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shiprocket_shipment_id text;

-- Create indexes for Shiprocket fields
CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_order_id
  ON orders(shiprocket_order_id)
  WHERE shiprocket_order_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_shiprocket_shipment_id
  ON orders(shiprocket_shipment_id)
  WHERE shiprocket_shipment_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN orders.shiprocket_order_id IS 'Shiprocket order ID for tracking integration';
COMMENT ON COLUMN orders.shiprocket_shipment_id IS 'Shiprocket shipment ID for tracking integration';
