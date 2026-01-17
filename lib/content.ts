import { createClient } from '@supabase/supabase-js';
import type { Product } from '@/lib/types';

/* ================================================================== */
/* TYPES & INTERFACES                                                 */
/* ================================================================== */

export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  primary_cta_label: string | null;
  primary_cta_url: string | null;
  secondary_cta_label: string | null;
  secondary_cta_url: string | null;
  image_url: string;
  sort_order: number;
  is_active: boolean;
}

export interface Collection {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  is_active: boolean;
  collection_type: 'category' | 'manual';
  category_id: string | null;
  sort_order: number;
}

// ✅ FIXED: Extends Product to inherit created_at, id, etc.
// Only adding the specific relations/computed fields here.
export interface ProductWithImages extends Product {
  /* Relations */
  product_prices?: Array<{
    region: string;
    currency: string;
    price: number;
    mrp?: number | null;
  }>;

  primary_image_url: string | null;
  
  images: Array<{
    id?: string;
    image_url: string;
    is_primary: boolean;
  }>;
}

/* ================================================================== */
/* SUPABASE CLIENT                                                    */
/* ================================================================== */

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/* ================================================================== */
/* PRODUCT IMAGE MAPPERS                                              */
/* ================================================================== */

function mapProductsWithImages(data: any[] | null): ProductWithImages[] {
  return (data || []).map((product: any) => ({
    ...product,
    images: product.product_images || [],
    // ✅ Ensure primary image logic is robust
    primary_image_url:
      product.product_images?.find((img: any) => img.is_primary)?.image_url ||
      product.product_images?.[0]?.image_url ||
      null,
    // ✅ Ensure prices array is always present
    product_prices: product.product_prices || [],
  }));
}

/* ================================================================== */
/* HERO SLIDES                                                        */
/* ================================================================== */

export async function getHomeHeroSlides(): Promise<HeroSlide[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('home_hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .limit(4);

  if (error) {
    console.error('Error fetching hero slides:', error);
    return [];
  }

  return data || [];
}

/* ================================================================== */
/* HOMEPAGE PRODUCTS                                                  */
/* ================================================================== */

export async function getMostLovedProducts(
  limit: number = 4,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_prices (
        currency,
        price,
        mrp
      ),
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('is_bestseller', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching bestseller products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

export async function getNewArrivals(
  limit: number = 4,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_prices (
        currency,
        price,
        mrp
      ),
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('is_new_arrival', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching new arrivals:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

/* ================================================================== */
/* SAREES PAGE (CLEAN - NO REGION/PRICING LOGIC)                      */
/* ================================================================== */

export async function getSareeProducts(): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  // ✅ Clean Query: Fetch everything, let client/resolver handle pricing
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_prices (
        currency,
        price,
        mrp,
        region
      ),
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('is_active', true)
    .eq('show_in_sarees', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching saree products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

/* ================================================================== */
/* FILTER OPTIONS                                                     */
/* ================================================================== */

export async function getFilterOptions(): Promise<{
  fabrics: string[];
  colors: string[];
  occasions: string[];
}> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select('fabric, color, occasion')
    .eq('show_in_sarees', true)
    .eq('is_active', true);

  if (error || !data) {
    console.error('Error fetching filter options:', error);
    return { fabrics: [], colors: [], occasions: [] };
  }

  return {
    fabrics: Array.from(new Set(data.map((p: any) => p.fabric).filter(Boolean))),
    colors: Array.from(new Set(data.map((p: any) => p.color).filter(Boolean))),
    occasions: Array.from(new Set(data.map((p: any) => p.occasion).filter(Boolean))),
  };
}

/* ================================================================== */
/* COLLECTIONS / FESTIVE / SIMILAR                                    */
/* ================================================================== */

export async function getAllCollections(): Promise<Collection[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return data || [];
}

export async function getCollectionBySlug(
  slug: string,
): Promise<Collection | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    console.error('Error fetching collection:', error);
    return null;
  }

  return data;
}

/* ✅ FIXED: Safe getCollectionProducts (Guards against invalid UUID) */
export async function getCollectionProducts(
  slug: string,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  // 1️⃣ Fetch collection FIRST
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('id, name')
    .eq('slug', slug)
    .single();

  // ✅ HARD GUARD: Prevent crash if slug invalid or collection missing
  if (collectionError || !collection?.id) {
    console.error('Invalid collection slug or fetch error:', slug, collectionError);
    return [];
  }

  // 2️⃣ Fetch products ONLY if collection.id exists
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_prices (
        currency,
        price,
        mrp
      ),
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('collection_id', collection.id)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching collection products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

export async function getFestiveEditProducts(): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_prices (
        currency,
        price,
        mrp
      ),
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('show_in_festive_edit', true)
    .eq('is_active', true);

  if (error) {
    console.error('Error fetching festive edit products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

/* ================================================================== */
/* SIMILAR PRODUCTS                                                   */
/* ================================================================== */

export async function getSimilarProducts(
  productId: string,
  limit: number = 4,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      name,
      slug,
      base_price_inr,
      mrp_inr,
      product_images (
        image_url,
        is_primary
      ),
      product_prices (
        currency,
        price,
        mrp
      )
    `)
    .neq('id', productId)
    .eq('is_active', true)
    .limit(limit);

  if (error) {
    console.error('Error fetching similar products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}