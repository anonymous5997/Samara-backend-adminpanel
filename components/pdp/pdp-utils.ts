/**
 * Presentation helpers for the product page. No data logic lives here.
 */

const OPTIMIZED_HOSTS = new Set(['wrsrobuicquzpfgnfnmh.supabase.co', 'images.pexels.com']);

/** next/image can only optimise hosts listed in next.config.js. */
export function isOptimizable(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && OPTIMIZED_HOSTS.has(u.hostname);
  } catch {
    return false;
  }
}

/**
 * Gallery filter: stock "placeholder.com" rows are not product photography,
 * so the page never shows them. Everything else is the product's own image.
 */
export function isGalleryImage(url: string | null | undefined): boolean {
  return typeof url === 'string' && url.trim() !== '' && !url.includes('placeholder.com');
}

export const pad2 = (n: number) => String(n).padStart(2, '0');

/** Circular icon button — the storefront's arrow/utility button. */
export const circleBtn =
  'flex h-[3.25rem] w-[3.25rem] shrink-0 items-center justify-center rounded-full border border-samara-ivory/40 text-samara-ivory transition-colors duration-300 ease-editorial hover:border-samara-gold hover:bg-samara-gold hover:text-samara-cream-ink focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[3px] focus-visible:outline-samara-gold disabled:pointer-events-none disabled:opacity-40';

export const goldBtn =
  'sm-btn bg-samara-gold text-samara-cream-ink hover:bg-samara-ivory';
