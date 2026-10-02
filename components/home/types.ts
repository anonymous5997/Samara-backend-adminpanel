/**
 * Homepage data contracts (Phase 4). All values come from Supabase at
 * request time — nothing here is hard-coded content.
 */
import type { ProductWithImages } from '@/lib/content';

export interface HomeHeroSlide {
  id: string | number;
  title: string;
  subtitle: string | null;
  /** Image or video URL managed in Admin → Hero Slides. */
  mediaUrl: string | null;
  mediaType: 'image' | 'video';
  primary: { label: string; href: string } | null;
  secondary: { label: string; href: string } | null;
}

export interface HomeCollection {
  id: string | number;
  name: string;
  slug: string;
  href: string;
  description: string | null;
  title: string | null;
  subtitle: string | null;
  /** collections.hero_image_url — null until set in the database. */
  imageUrl: string | null;
}

export interface HomeCategory {
  id: string;
  name: string;
  slug: string;
  href: string;
  description: string | null;
  /** categories.image_url, else the primary image of a real product in it. */
  imageUrl: string | null;
  imageIsProduct: boolean;
  productCount: number;
}

export interface HomeData {
  heroSlides: HomeHeroSlide[];
  collections: HomeCollection[];
  categories: HomeCategory[];
  bestsellers: ProductWithImages[];
  newArrivals: ProductWithImages[];
  /** False when New Arrivals is the same set as Best Sellers (then hide it). */
  newArrivalsDistinct: boolean;
}

export type { ProductWithImages };
