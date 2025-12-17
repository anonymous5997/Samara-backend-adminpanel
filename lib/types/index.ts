export type Currency = 'INR' | 'USD' | 'AED';

export interface CurrencyRate {
  target_currency: string;
  rate: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id?: string;
  description?: string;
  image_url?: string;
  is_active: boolean;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string;
  brand?: string;
  category_id?: string;
  base_price_inr: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color?: string;
  sku?: string;
  stock: number;
  additional_price_inr: number;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  is_primary: boolean;
  display_order: number;
}

export interface ProductWithDetails extends Product {
  category?: Category;
  variants: ProductVariant[];
  images: ProductImage[];
}

export interface CartItem {
  id: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  image_url?: string;
}

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  subtotal_inr: number;
  discount_inr: number;
  shipping_inr: number;
  total_amount_inr: number;
  currency: Currency;
  status: 'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  shipping_name?: string;
  shipping_email?: string;
  shipping_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_pincode?: string;
  tracking_number?: string;
  carrier?: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_details?: string;
  quantity: number;
  price_inr: number;
}

export interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  min_cart_value_inr: number;
  max_discount_inr?: number;
  valid_from: string;
  valid_to?: string;
  is_active: boolean;
}

export interface Profile {
  id: string;
  email: string;
  name?: string;
  phone?: string;
  role: 'customer' | 'admin';
}
