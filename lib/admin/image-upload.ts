// Shared helpers for admin image uploads.
// Uses the same approach as the admin hero pages: upload into the existing
// 'hero-media' storage bucket, then store the bucket's public URL.
import { supabase } from '@/lib/supabase/client';

export const ADMIN_IMAGE_BUCKET = 'hero-media';
export const ADMIN_IMAGE_MAX_BYTES = 8 * 1024 * 1024; // 8MB

/** Returns an error message if the file is not acceptable, otherwise null. */
export function validateAdminImage(file: File): string | null {
  if (!file.type.startsWith('image/')) {
    return 'Please choose an image file (JPG, PNG, WebP, etc.).';
  }
  if (file.size > ADMIN_IMAGE_MAX_BYTES) {
    const mb = (file.size / (1024 * 1024)).toFixed(1);
    return `Image is too large (${mb}MB). Maximum size is 8MB.`;
  }
  return null;
}

/**
 * Uploads an image to hero-media under the given prefix (e.g. 'categories')
 * and returns its public URL, or null if the upload failed.
 */
export async function uploadAdminImage(
  file: File,
  prefix: 'categories' | 'collections'
): Promise<string | null> {
  const ext = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${prefix}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(ADMIN_IMAGE_BUCKET)
    .upload(filePath, file);

  if (uploadError) {
    console.error(uploadError);
    return null;
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(ADMIN_IMAGE_BUCKET).getPublicUrl(filePath);

  return publicUrl;
}
