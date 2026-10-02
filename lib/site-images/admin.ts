// Admin write side of Site Images (browser). Same client and upload style as
// app/admin/hero/page.tsx and lib/admin/image-upload.ts, but each slot is a
// fixed path that is overwritten (upsert) instead of a new random file name.
import { supabase } from '@/lib/supabase/client';
import { validateAdminImage } from '@/lib/admin/image-upload';
import {
  SITE_IMAGE_BUCKET,
  siteImagePath,
  siteImageVersion,
  type SiteImageKey,
} from './slots';

export { validateAdminImage };

/** Public URL of the slot (not versioned). */
export function siteImagePublicUrl(key: SiteImageKey): string {
  return supabase.storage.from(SITE_IMAGE_BUCKET).getPublicUrl(siteImagePath(key)).data.publicUrl;
}

/**
 * Checks whether the slot has an image. Returns a versioned preview URL, or
 * null when the slot is empty (or the check fails).
 */
export async function fetchSiteImagePreview(key: SiteImageKey): Promise<string | null> {
  const publicUrl = siteImagePublicUrl(key);
  try {
    const res = await fetch(publicUrl, { method: 'HEAD', cache: 'no-store' });
    if (!res.ok) return null;
    const version = siteImageVersion(res.headers.get('etag'), res.headers.get('last-modified'));
    return `${publicUrl}?v=${version}`;
  } catch {
    return null;
  }
}

/** Uploads (or replaces) the slot image. Returns an error message or null. */
export async function uploadSiteImage(key: SiteImageKey, file: File): Promise<string | null> {
  const problem = validateAdminImage(file);
  if (problem) return problem;

  const { error } = await supabase.storage.from(SITE_IMAGE_BUCKET).upload(siteImagePath(key), file, {
    upsert: true,
    contentType: file.type,
    // Short CDN cache so a replacement (or removal) is seen within ~1 minute.
    cacheControl: '60',
  });
  if (error) {
    console.error(error);
    return error.message || 'Failed to upload image';
  }
  return null;
}

/** Removes the slot image (the page falls back to its default design). */
export async function removeSiteImage(key: SiteImageKey): Promise<string | null> {
  const { data, error } = await supabase.storage.from(SITE_IMAGE_BUCKET).remove([siteImagePath(key)]);
  if (error) {
    console.error(error);
    return error.message || 'Failed to remove image';
  }
  // Storage returns the deleted objects; an empty list means nothing was
  // removed (already empty, or the storage policy did not allow the delete).
  if (!data || data.length === 0) {
    return 'Nothing was removed (the slot may already be empty, or deletes are not permitted).';
  }
  return null;
}
