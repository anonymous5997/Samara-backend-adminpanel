import { createClient } from '@supabase/supabase-js';

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

export interface ProductWithImages {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  base_price_inr: number;

  is_bestseller: boolean;
  bestseller_badge_label: string;
  is_new_arrival: boolean;
  is_active: boolean;

  // filter / placement fields
  show_in_sarees: boolean;
  show_in_festive_edit: boolean;
  fabric: string | null;
  color: string | null;
  occasion: string | null;

  category_id: string | null;
  primary_image_url: string | null;
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
}

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

function mapProductsWithImages(data: any[] | null): ProductWithImages[] {
  return (data || []).map((product: any) => ({
    ...product,
    images: product.product_images || [],
    primary_image_url:
      product.product_images?.find((img: any) => img.is_primary)?.image_url ||
      product.product_images?.[0]?.image_url ||
      null,
  }));
}

/* ------------------------------------------------------------------ */
/*  HERO SLIDES                                                        */
/* ------------------------------------------------------------------ */

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

/* ------------------------------------------------------------------ */
/*  HOMEPAGE PRODUCTS                                                  */
/* ------------------------------------------------------------------ */

export async function getMostLovedProducts(
  limit: number = 4,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
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

  const { data: flaggedProducts, error: flaggedError } = await supabase
    .from('products')
    .select(
      `
      *,
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

  if (flaggedError) {
    console.error('Error fetching new arrival products:', flaggedError);
  }

  if (flaggedProducts && flaggedProducts.length > 0) {
    return mapProductsWithImages(flaggedProducts);
  }

  const { data: latestProducts, error: latestError } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (latestError) {
    console.error('Error fetching latest products:', latestError);
    return [];
  }

  return mapProductsWithImages(latestProducts);
}

/* ------------------------------------------------------------------ */
/*  SAREES PAGE: PRODUCTS + FILTER OPTIONS                             */
/* ------------------------------------------------------------------ */

export async function getSareeProducts(filters?: {
  fabric?: string[];
  color?: string[];
  occasion?: string[];
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  let query = supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('is_active', true)
    .eq('show_in_sarees', true)
    .order('created_at', { ascending: false });

  if (filters?.fabric && filters.fabric.length > 0) {
    query = query.in('fabric', filters.fabric);
  }
  if (filters?.color && filters.color.length > 0) {
    query = query.in('color', filters.color);
  }
  if (filters?.occasion && filters.occasion.length > 0) {
    query = query.in('occasion', filters.occasion);
  }
  if (typeof filters?.minPrice === 'number') {
    query = query.gte('base_price_inr', filters.minPrice);
  }
  if (typeof filters?.maxPrice === 'number') {
    query = query.lte('base_price_inr', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching saree products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

/** Returns all distinct fabrics / colors / occasions used by saree products */
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

  const fabrics = Array.from(
    new Set(data.map((p: any) => p.fabric).filter(Boolean)),
  ) as string[];

  const colors = Array.from(
    new Set(data.map((p: any) => p.color).filter(Boolean)),
  ) as string[];

  const occasions = Array.from(
    new Set(data.map((p: any) => p.occasion).filter(Boolean)),
  ) as string[];

  return { fabrics, colors, occasions };
}

/* ------------------------------------------------------------------ */
/*  COLLECTIONS                                                        */
/* ------------------------------------------------------------------ */

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

export async function getCollectionProducts(
  slug: string,
): Promise<ProductWithImages[]> {
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return [];
  }

  if (collection.collection_type === 'category' && collection.category_id) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `,
      )
      .eq('category_id', collection.category_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching category products:', error);
      return [];
    }

    return mapProductsWithImages(data);
  }

  const supabase = getSupabaseClient();
  const { data: collectionProductsData, error } = await supabase
    .from('collection_products')
    .select(
      `
      sort_order,
      products (
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      )
    `,
    )
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching manual collection products:', error);
    return [];
  }

  return (collectionProductsData || [])
    .filter((cp: any) => cp.products)
    .map((cp: any) => {
      const product = Array.isArray(cp.products) ? cp.products[0] : cp.products;
      return {
        ...product,
        images: product.product_images || [],
        primary_image_url:
          product.product_images?.find((img: any) => img.is_primary)?.image_url ||
          product.product_images?.[0]?.image_url ||
          null,
      };
    });
}

/* ------------------------------------------------------------------ */
/*  FESTIVE EDIT                                                       */
/* ------------------------------------------------------------------ */

export async function getFestiveEditProducts(): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('show_in_festive_edit', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching festive edit products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}

/* ------------------------------------------------------------------ */
/*  SIMILAR PRODUCTS                                                   */
/* ------------------------------------------------------------------ */

export async function getSimilarProducts(
  productId: string,
  limit: number = 4,
): Promise<ProductWithImages[]> {
  const supabase = getSupabaseClient();

  const { data: currentProduct } = await supabase
    .from('products')
    .select('category_id')
    .eq('id', productId)
    .maybeSingle();

  if (!currentProduct?.category_id) {
    const { data, error } = await supabase
      .from('products')
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `,
      )
      .neq('id', productId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching similar products:', error);
      return [];
    }

    return mapProductsWithImages(data);
  }

  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `,
    )
    .eq('category_id', currentProduct.category_id)
    .neq('id', productId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching similar products:', error);
    return [];
  }

  return mapProductsWithImages(data);
}
