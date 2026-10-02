// Site Images: admin-replaceable editorial photos.
//
// Storage-only design (no tables): every slot is one FIXED object in the
// existing public `hero-media` bucket at `site/<key>` (no file extension; the
// upload carries the real contentType). The admin upserts that exact path and
// the storefront checks whether it exists. An empty slot = the default design.
//
// This file is client-safe (no server-only APIs) so the admin page can use it.

export const SITE_IMAGE_BUCKET = 'hero-media';
export const SITE_IMAGE_PREFIX = 'site';

export type SiteImageKey =
  | 'story'
  | 'about'
  | 'shop-header'
  | 'sarees-header'
  | 'collections-header'
  | 'festive-header'
  | 'closing'
  | 'login';

export interface SiteImageSlot {
  key: SiteImageKey;
  label: string;
  description: string;
  /** Where on the storefront the image appears. */
  usedOn: string;
  /** Recommended pixel size, e.g. "1600 × 2000". */
  recommendedSize: string;
  /** What the page shows while the slot is empty. */
  fallback: string;
}

export interface SiteImage {
  /** Public URL with a `?v=` version so a replaced file busts caches. */
  url: string;
  width?: number;
  height?: number;
}

export const SITE_IMAGE_SLOTS: readonly SiteImageSlot[] = [
  {
    key: 'story',
    label: 'Homepage: Our Story',
    description: 'Portrait photo beside the "Our Story" text on the homepage.',
    usedOn: '/ (Our Story block)',
    recommendedSize: '1600 × 2000 (portrait)',
    fallback: 'Gold "S" monogram panel',
  },
  {
    key: 'about',
    label: 'About: Woven Luxury',
    description: 'Portrait photo beside "Woven Luxury" on the About page.',
    usedOn: '/about',
    recommendedSize: '1600 × 2000 (portrait)',
    fallback: 'Beige Samara logo on a cream panel',
  },
  {
    key: 'shop-header',
    label: 'Shop header band',
    description: 'Full-width image behind the page title on Shop.',
    usedOn: '/shop',
    recommendedSize: '2400 × 1000 (landscape)',
    fallback: 'Plain dark title band',
  },
  {
    key: 'sarees-header',
    label: 'Sarees header band',
    description: 'Full-width image behind the page title on Sarees.',
    usedOn: '/sarees',
    recommendedSize: '2400 × 1000 (landscape)',
    fallback: 'Plain forest title band',
  },
  {
    key: 'collections-header',
    label: 'Collections header band',
    description: 'Full-width image behind the page title on Collections.',
    usedOn: '/collections',
    recommendedSize: '2400 × 1000 (landscape)',
    fallback: 'Plain forest title band',
  },
  {
    key: 'festive-header',
    label: 'Festive Edit header band',
    description: 'Full-width image behind the page title on Festive Edit.',
    usedOn: '/festive-edit',
    recommendedSize: '2400 × 1000 (landscape)',
    fallback: 'Forest title band with the festive ornament',
  },
  {
    key: 'closing',
    label: 'Homepage: closing statement',
    description: 'Background behind "Woven for every woman" at the end of the homepage (darkened).',
    usedOn: '/ (closing statement)',
    recommendedSize: '2400 × 1200 (landscape)',
    fallback: 'Forest-to-black gradient',
  },
  {
    key: 'login',
    label: 'Login brand panel',
    description: 'Background of the left brand panel on the sign-in page (desktop only, darkened).',
    usedOn: '/auth/login',
    recommendedSize: '1600 × 2000 (portrait)',
    fallback: 'Forest panel with the Samara logo',
  },
] as const;

/** Object path inside the bucket, e.g. `site/story`. */
export function siteImagePath(key: SiteImageKey): string {
  return `${SITE_IMAGE_PREFIX}/${key}`;
}

/** Short, URL-safe version token from an ETag or Last-Modified header. */
export function siteImageVersion(etag: string | null, lastModified: string | null): string {
  const raw = (etag ?? '').replace(/^W\//, '').replace(/"/g, '').trim();
  if (raw) return encodeURIComponent(raw.slice(0, 64));
  const source = lastModified ?? '';
  // djb2 hash: stable, tiny, dependency-free.
  let hash = 5381;
  for (let i = 0; i < source.length; i++) {
    hash = ((hash << 5) + hash + source.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}
