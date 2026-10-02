// Storefront read side of Site Images (server components only: it relies on
// Next's fetch cache via `next: { revalidate }`). See ./slots.ts for the design.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import {
  SITE_IMAGE_BUCKET,
  siteImagePath,
  siteImageVersion,
  type SiteImage,
  type SiteImageKey,
} from './slots';

export * from './slots';

/** Seconds between existence re-checks (matches the admin "live within ~1 minute"). */
export const SITE_IMAGE_REVALIDATE = 60;

let anonClient: SupabaseClient | null = null;

function getAnonClient(): SupabaseClient | null {
  if (anonClient) return anonClient;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  anonClient = createClient(url, anonKey, { auth: { persistSession: false } });
  return anonClient;
}

/**
 * Returns the slot's public URL (versioned with the object's ETag) when an
 * image has been uploaded, or null when the slot is empty or anything fails.
 * Never throws: callers always fall back to the default design on null.
 */
export async function getSiteImage(key: SiteImageKey): Promise<SiteImage | null> {
  try {
    const client = getAnonClient();
    if (!client) return null;

    const {
      data: { publicUrl },
    } = client.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(siteImagePath(key));

    const res = await fetch(publicUrl, {
      method: 'HEAD',
      next: { revalidate: SITE_IMAGE_REVALIDATE },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null;

    const type = res.headers.get('content-type');
    if (type && !type.startsWith('image/')) return null;

    const version = siteImageVersion(res.headers.get('etag'), res.headers.get('last-modified'));
    return { url: `${publicUrl}?v=${version}` };
  } catch {
    return null;
  }
}

/** Looks up several slots in parallel; missing slots map to null. */
export async function getSiteImages<K extends SiteImageKey>(
  keys: readonly K[],
): Promise<Record<K, SiteImage | null>> {
  const results = await Promise.all(keys.map((key) => getSiteImage(key)));
  return Object.fromEntries(keys.map((key, i) => [key, results[i]])) as Record<K, SiteImage | null>;
}
