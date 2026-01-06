'use server';

import { createClient } from '@/lib/supabase/server';

export async function createOrderFromCart() {
  const supabase = await createClient();

  // 1. Authenticate User
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('Unauthorized');

  // 2. Fetch Cart Items (SOURCE OF TRUTH)
  // We explicitly fetch 'unit_price_inr' (Payment Price) and 'currency' (Display Context)
  const { data: cartItems, error } = await supabase
    .from('cart_items')
    .select(`
      quantity,
      unit_price,      
      unit_price_inr,  
      currency,
      product_id,
      variant_id
    `)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error fetching cart:', error);
    throw new Error('Failed to fetch cart items');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Cart is empty');
  }

  // 3. Compute Totals (STRICTLY IN INR)
  // We ignore 'unit_price' for calculation and only use 'unit_price_inr'
  let subtotalINR = 0;

  const orderItems = cartItems.map(item => {
    // Determine effective INR price (Landed Price stored in Cart)
    const unitPriceINR = item.unit_price_inr ?? 0;
    const lineTotalINR = unitPriceINR * item.quantity;

    subtotalINR += lineTotalINR;

    return {
      product_id: item.product_id,
      variant_id: item.variant_id ?? null,
      quantity: item.quantity,
      unit_price_inr: unitPriceINR, // Store the locked INR price
      subtotal_inr: lineTotalINR,   // Store the line total in INR
    };
  });

  // 4. Create Order Record
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: user.id,
      subtotal_inr: subtotalINR,
      total_amount_inr: subtotalINR,        // Add shipping logic here if needed
      currency_used: cartItems[0].currency, // Store what currency the user saw (USD, AED, etc.)
      status: 'pending',
      payment_status: 'pending',
    })
    .select()
    .single();

  if (orderError) {
    console.error('Order creation failed:', orderError);
    throw new Error('Failed to create order');
  }

  // 5. Insert Order Items
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(
      orderItems.map(item => ({
        ...item,
        order_id: order.id,
      }))
    );

  if (itemsError) {
    console.error('Order items creation failed:', itemsError);
    // Note: In a production app, you might want to delete the created order here 
    // to prevent "ghost" orders without items.
    throw new Error('Failed to create order items');
  }

  // Return the Order ID so the client can redirect to payment/confirmation
  return order.id;
}