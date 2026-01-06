'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

const REGION_CURRENCY_MAP: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  CA: 'CAD',
  AE: 'AED',
  EU: 'EUR',
  GB: 'GBP',
};

export async function createProduct(payload: {
  name: string;
  brand?: string | null;
  description?: string | null;

  base_price_inr: number;
  mrp_inr?: number | null;

  status: 'active' | 'draft';
  is_active: boolean;
  slug: string;

  fabric?: string | null;
  work?: string | null;
  occasion?: string | null;
  color?: string | null;
  care_instructions?: string | null;
  shipping_time?: string | null;
  why_women_love?: string | null;

  is_bestseller?: boolean;
  is_new_arrival?: boolean;
  is_handcrafted?: boolean;
  is_premium_material?: boolean;
  is_perfect_for_special_occasions?: boolean;

  show_in_sarees?: boolean;
  show_in_festive_edit?: boolean;

  regionalPrices: Record<string, string>;
}) {
  try {
    /* -----------------------------
       1. Create product
    ----------------------------- */
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .insert({
        name: payload.name,
        brand: payload.brand ?? null,
        description: payload.description ?? null,
        base_price_inr: payload.base_price_inr,
        mrp_inr: payload.mrp_inr ?? null,
        status: payload.status,
        is_active: payload.is_active,
        slug: payload.slug,

        fabric: payload.fabric ?? null,
        work: payload.work ?? null,
        occasion: payload.occasion ?? null,
        color: payload.color ?? null,
        care_instructions: payload.care_instructions ?? null,
        shipping_time: payload.shipping_time ?? null,
        why_women_love: payload.why_women_love ?? null,

        is_bestseller: payload.is_bestseller ?? false,
        is_new_arrival: payload.is_new_arrival ?? false,
        is_handcrafted: payload.is_handcrafted ?? false,
        is_premium_material: payload.is_premium_material ?? false,
        is_perfect_for_special_occasions:
          payload.is_perfect_for_special_occasions ?? false,

        show_in_sarees: payload.show_in_sarees ?? true,
        show_in_festive_edit: payload.show_in_festive_edit ?? false,
      })
      .select('id')
      .single();

    if (productError) throw productError;

    const productId = product.id;

    /* -----------------------------
       2. Save regional prices
       (UPSERT = safe)
    ----------------------------- */
    const priceRows = Object.entries(payload.regionalPrices)
      .filter(([_, price]) => Number(price) > 0)
      .map(([region, price]) => ({
        product_id: productId,
        region,
        currency: REGION_CURRENCY_MAP[region],
        price: Number(price),
      }));

    if (priceRows.length > 0) {
      const { error: priceError } = await supabaseAdmin
        .from('product_prices')
        .upsert(priceRows, {
          onConflict: 'product_id,region',
        });

      if (priceError) throw priceError;
    }

    return { success: true, productId };
  } catch (error: any) {
    console.error('createProduct error:', error);
    return { success: false, error: error.message };
  }
}
