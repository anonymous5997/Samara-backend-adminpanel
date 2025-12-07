import { supabase } from './supabase/client';

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
  category_id: string | null;
  primary_image_url: string | null;
  images: Array<{
    id: string;
    image_url: string;
    is_primary: boolean;
  }>;
}

export async function getHomeHeroSlides(): Promise<HeroSlide[]> {
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

export async function getMostLovedProducts(limit: number = 4): Promise<ProductWithImages[]> {
  const { data, error } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('is_bestseller', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching bestseller products:', error);
    return [];
  }

  return (data || []).map(product => ({
    ...product,
    images: product.product_images || [],
    primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                        (product.product_images || [])[0]?.image_url ||
                        null,
  }));
}

export async function getNewArrivals(limit: number = 4): Promise<ProductWithImages[]> {
  const { data: flaggedProducts, error: flaggedError } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('is_new_arrival', true)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (flaggedError) {
    console.error('Error fetching new arrival products:', flaggedError);
  }

  if (flaggedProducts && flaggedProducts.length > 0) {
    return flaggedProducts.map(product => ({
      ...product,
      images: product.product_images || [],
      primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                          (product.product_images || [])[0]?.image_url ||
                          null,
    }));
  }

  const { data: latestProducts, error: latestError } = await supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (latestError) {
    console.error('Error fetching latest products:', latestError);
    return [];
  }

  return (latestProducts || []).map(product => ({
    ...product,
    images: product.product_images || [],
    primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                        (product.product_images || [])[0]?.image_url ||
                        null,
  }));
}

export async function getSareeProducts(filters?: {
  fabric?: string;
  color?: string;
  occasion?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<ProductWithImages[]> {
  const { data: sareeCategory } = await supabase
    .from('categories')
    .select('id')
    .eq('slug', 'sarees')
    .maybeSingle();

  if (!sareeCategory) {
    console.warn('Sarees category not found');
    return [];
  }

  let query = supabase
    .from('products')
    .select(`
      *,
      product_images (
        id,
        image_url,
        is_primary,
        display_order
      )
    `)
    .eq('category_id', sareeCategory.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (filters?.minPrice) {
    query = query.gte('base_price_inr', filters.minPrice);
  }

  if (filters?.maxPrice) {
    query = query.lte('base_price_inr', filters.maxPrice);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching saree products:', error);
    return [];
  }

  return (data || []).map(product => ({
    ...product,
    images: product.product_images || [],
    primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                        (product.product_images || [])[0]?.image_url ||
                        null,
  }));
}

export async function getAllCollections(): Promise<Collection[]> {
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

export async function getCollectionBySlug(slug: string): Promise<Collection | null> {
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

export async function getCollectionProducts(slug: string): Promise<ProductWithImages[]> {
  const collection = await getCollectionBySlug(slug);

  if (!collection) {
    return [];
  }

  if (collection.collection_type === 'category' && collection.category_id) {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          image_url,
          is_primary,
          display_order
        )
      `)
      .eq('category_id', collection.category_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching category products:', error);
      return [];
    }

    return (data || []).map(product => ({
      ...product,
      images: product.product_images || [],
      primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                          (product.product_images || [])[0]?.image_url ||
                          null,
    }));
  }

  const { data: collectionProductsData, error } = await supabase
    .from('collection_products')
    .select(`
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
    `)
    .eq('collection_id', collection.id)
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching manual collection products:', error);
    return [];
  }

  return (collectionProductsData || [])
    .filter(cp => cp.products)
    .map(cp => {
      const product = Array.isArray(cp.products) ? cp.products[0] : cp.products;
      return {
        ...product,
        images: product.product_images || [],
        primary_image_url: (product.product_images || []).find((img: any) => img.is_primary)?.image_url ||
                            (product.product_images || [])[0]?.image_url ||
                            null,
      };
    });
}
