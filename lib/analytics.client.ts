import { supabase } from '@/lib/supabase/client';

export async function trackAnalyticsEvent(
  eventType: 'add_to_cart' | 'checkout_started' | 'checkout_completed',
  productId?: string,
  orderId?: string,
  userId?: string | null,
  sessionId?: string
) {
  try {
    const { error } = await supabase.from('analytics_events').insert({
      event_type: eventType,
      product_id: productId ?? null,
      order_id: orderId ?? null,
      user_id: userId ?? null,
      session_id: sessionId ?? null,
    });

    if (error) {
      console.error('Analytics insert failed:', error);
    }
  } catch (err) {
    console.error('Analytics exception:', err);
  }
}
