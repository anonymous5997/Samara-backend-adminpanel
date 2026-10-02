// Server-only: imported by app/page.tsx (a Server Component). Do not import from client components.
import { createClient as createAnonClient } from '@supabase/supabase-js';
import { getAllCollections, getMostLovedProducts, getNewArrivals } from '@/lib/content';
import type { HomeCategory, HomeCollection, HomeData, HomeHeroSlide } from './types';

/* Read-only homepage loader. Reuses existing lib/content queries unchanged;
   the only new query reads category/product images for the category tiles. */

const clean = (v: unknown): string | null => {
  if (typeof v !== 'string') return null;
  const t = v.trim();
  return t.length ? t : null;
};

function toHeroSlide(row: Record<string, any>): HomeHeroSlide {
  // The table has used several CTA column names over time
  // (primary_cta_label / cta_label, cta_url / cta_href); accept any.
  const pLabel = clean(row.cta_label) ?? clean(row.primary_cta_label);
  const pHref = clean(row.cta_url) ?? clean(row.cta_href) ?? clean(row.primary_cta_url);
  const sLabel = clean(row.secondary_cta_label);
  const sHref = clean(row.secondary_cta_url);
  return {
    id: row.id,
    title: clean(row.title) ?? '',
    subtitle: clean(row.subtitle),
    mediaUrl: clean(row.media_url) ?? clean(row.image_url),
    mediaType: row.media_type === 'video' ? 'video' : 'image',
    primary: pLabel && pHref ? { label: pLabel, href: pHref } : null,
    secondary: sLabel && sHref ? { label: sLabel, href: sHref } : null,
  };
}

// Public storefront reads use the anon key (RLS applies), never the service role.
function publicClient() {
  return createAnonClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

async function getHeroSlides(): Promise<HomeHeroSlide[]> {
  // Same query the homepage already used (app/page.tsx).
  const supabase = publicClient();
  const { data, error } = await supabase
    .from('hero_slides')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');
  if (error) console.error('Error fetching hero slides:', error);
  return (data ?? []).map(toHeroSlide).filter((s) => s.title || s.mediaUrl);
}

async function getCategoriesWithImages(): Promise<HomeCategory[]> {
  const supabase = publicClient();

  const [{ data: cats, error: cErr }, { data: prods, error: pErr }] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name, slug, description, image_url, parent_id')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('products')
      .select('id, category_id, created_at, product_images(image_url, is_primary, display_order)')
      .eq('is_active', true)
      .order('created_at', { ascending: false }),
  ]);
  if (cErr) console.error('Error fetching categories:', cErr);
  if (pErr) console.error('Error fetching category images:', pErr);

  const categories = cats ?? [];
  const products = prods ?? [];

  // Real product photos only (no placeholder services), primary first.
  const productImages = (p: any): string[] => {
    const imgs = (p.product_images ?? []).filter(
      (i: any) =>
        typeof i.image_url === 'string' &&
        /^https?:\/\//.test(i.image_url) &&
        !i.image_url.includes('placeholder.com'),
    );
    return [...imgs]
      .sort(
        (a: any, b: any) =>
          Number(!!b.is_primary) - Number(!!a.is_primary) ||
          (a.display_order ?? 0) - (b.display_order ?? 0),
      )
      .map((i: any) => i.image_url as string);
  };

  // Prefer products with fuller galleries (better-photographed pieces), and
  // give each category a different photo where one exists.
  const used = new Set<string>();

  return categories.map((c: any) => {
    // A parent category also covers its direct children.
    const ids = new Set([c.id, ...categories.filter((x: any) => x.parent_id === c.id).map((x: any) => x.id)]);
    const inCat = products.filter((p: any) => ids.has(p.category_id));
    const candidates = [...inCat]
      .sort((a: any, b: any) => productImages(b).length - productImages(a).length)
      .flatMap(productImages);
    const own = clean(c.image_url);
    const productImage = own ? null : candidates.find((u) => !used.has(u)) ?? candidates[0] ?? null;
    if (productImage) used.add(productImage);
    return {
      id: c.id,
      name: c.name,
      slug: c.slug,
      href: `/shop?category=${c.slug}`,
      description: clean(c.description),
      imageUrl: own ?? productImage,
      imageIsProduct: !own && !!productImage,
      productCount: inCat.length,
    };
  });
}

async function getCollections(): Promise<HomeCollection[]> {
  const rows = await getAllCollections();
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    href: `/collections/${c.slug}`,
    description: clean(c.description),
    title: clean(c.hero_title),
    subtitle: clean(c.hero_subtitle),
    imageUrl: clean(c.hero_image_url),
  }));
}

export async function getHomeData(): Promise<HomeData> {
  const [heroSlides, collections, categories, bestsellers, newArrivals] = await Promise.all([
    getHeroSlides(),
    getCollections(),
    getCategoriesWithImages(),
    getMostLovedProducts(8),
    getNewArrivals(8),
  ]);
  const best = new Set(bestsellers.map((p) => p.id));
  const newArrivalsDistinct =
    newArrivals.length > 0 &&
    (newArrivals.length !== bestsellers.length || newArrivals.some((p) => !best.has(p.id)));

  return { heroSlides, collections, categories, bestsellers, newArrivals, newArrivalsDistinct };
}
