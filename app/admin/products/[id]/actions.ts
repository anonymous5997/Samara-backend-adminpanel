'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

/* ----------------------------------------------------- */
/* GET PRODUCT FOR ADMIN EDIT PAGE                       */
/* ----------------------------------------------------- */
export async function getAdminProduct(productId: string) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      product_prices (
        id,
        region,
        currency,
        price
      )
    `)
    .eq('id', productId)
    .single();

  if (error) {
    console.error('getAdminProduct error:', error);
    return null;
  }

  return data;
}

/* ----------------------------------------------------- */
/* UPDATE PRODUCT CORE DETAILS                           */
/* ----------------------------------------------------- */
export async function updateAdminProduct(payload: {
  id: string;
  name: string;
  brand?: string | null;
  description?: string | null;

  base_price_inr: number;
  mrp_inr?: number | null;

  is_active: boolean;

  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_handcrafted?: boolean;
  is_premium_material?: boolean;
  is_perfect_for_special_occasions?: boolean;

  fabric?: string | null;
  work?: string | null;
  occasion?: string | null;
  color?: string | null;

  care_instructions?: string | null;
  shipping_time?: string | null;
  why_women_love?: string | null;

  show_in_sarees?: boolean;
  show_in_festive_edit?: boolean;
}) {
  try {
    const { error } = await supabaseAdmin
      .from('products')
      .update({
        name: payload.name,
        brand: payload.brand,
        description: payload.description,

        base_price_inr: payload.base_price_inr,
        mrp_inr: payload.mrp_inr,

        is_active: payload.is_active,

        is_bestseller: payload.is_bestseller,
        is_new_arrival: payload.is_new_arrival,
        is_handcrafted: payload.is_handcrafted,
        is_premium_material: payload.is_premium_material,
        is_perfect_for_special_occasions:
          payload.is_perfect_for_special_occasions,

        fabric: payload.fabric,
        work: payload.work,
        occasion: payload.occasion,
        color: payload.color,

        care_instructions: payload.care_instructions,
        shipping_time: payload.shipping_time,
        why_women_love: payload.why_women_love,

        show_in_sarees: payload.show_in_sarees,
        show_in_festive_edit: payload.show_in_festive_edit,
      })
      .eq('id', payload.id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('updateAdminProduct error:', error);
    return { success: false, error: error.message };
  }
}

/* ----------------------------------------------------- */
/* SAVE REGIONAL FINAL PRICES (FIXED & SAFE)             */
/* ----------------------------------------------------- */
export async function savePrices(
  productId: string,
  prices: Record<string, string>
) {
  try {
    const REGION_CURRENCY_MAP: Record<string, string> = {
      IN: 'INR',
      US: 'USD',
      CA: 'CAD',
      AE: 'AED',
      GB: 'GBP',
      EU: 'EUR',
    };

    const rows = Object.entries(prices)
      .filter(([_, price]) => price && Number(price) > 0)
      .map(([region, price]) => ({
        product_id: productId,
        region,
        currency: REGION_CURRENCY_MAP[region],
        price: Number(price),
      }));

    if (rows.length === 0) {
      return { success: true };
    }

    const { error } = await supabaseAdmin
      .from('product_prices')
      .upsert(rows, {
        onConflict: 'product_id,region',
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('savePrices error:', error);
    return { success: false, error: error.message };
  }
}
