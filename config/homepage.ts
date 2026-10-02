/**
 * Homepage editorial copy and optional editorial imagery (Phase 4).
 *
 * Product, category, collection and hero data come from Supabase.
 * This file only holds brand copy that has no database home, taken from
 * Samara's existing site copy (About page, metadata, logo tagline).
 *
 * Editorial images: there is no admin field for these sections yet.
 * Each slot accepts a URL; while `null` the section renders type-only.
 * Record every image you add in IMAGE_CREDITS.md.
 */

export interface EditorialImage {
  src: string;
  alt: string;
}

export const HOME_COPY = {
  /** Small line above the hero headline (logo tagline). */
  heroEyebrow: 'Woven for every woman',
  /** Vertical side note on desktop hero. */
  heroAside: 'Handcrafted Sambalpuri sarees',
  /** Keyword row under the hero buttons. */
  heroKeywords: ['Heritage', 'Handcrafted', 'Timeless'],

  marquee: [
    'Woven for every woman',
    'Handcrafted Sambalpuri sarees',
    'Where heritage meets modern elegance',
    'Indian heritage, modern elegance',
  ],

  /** From the About page. */
  story: {
    eyebrow: 'Our Story',
    titleLead: 'Indian heritage,',
    titleAccent: 'modern elegance.',
    body: [
      'At Samara, we celebrate the timeless art of saree weaving. Each piece in our collection is a testament to generations of skilled craftsmanship.',
      'Our sarees are more than garments — they are wearable art, designed to make every woman feel like royalty.',
    ],
    cta: { label: 'Our Story', href: '/about' },
  },

  closing: {
    lead: 'Woven for',
    accent: 'every woman.',
  },
} as const;

/** Optional editorial photography. `null` = type-only layout. */
export const HOME_IMAGES: { story: EditorialImage | null } = {
  story: null,
};

/**
 * Trust strip — only claims the application actually supports:
 * Razorpay checkout, /track-order, /return-policy, multi-currency selector.
 */
export const TRUST_ITEMS = [
  { icon: 'shield', title: 'Secure payments', detail: 'Checkout by Razorpay', href: null },
  { icon: 'truck', title: 'Track your order', detail: 'Track any order online', href: '/track-order' },
  { icon: 'rotate', title: 'Returns', detail: 'Within 14 days, as per policy', href: '/return-policy' },
  { icon: 'globe', title: 'Shop in your currency', detail: 'INR · USD · AED · CAD · GBP', href: null },
] as const;
