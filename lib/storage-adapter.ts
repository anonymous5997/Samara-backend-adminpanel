import { generatePresignedUploadUrl, isS3Enabled, uploadToS3 } from './aws/s3';
import { supabase } from './supabase/client';

const USE_S3 = process.env.USE_S3 === 'true' || process.env.NEXT_PUBLIC_USE_S3 === 'true';
const USE_CLOUDINARY = process.env.USE_CLOUDINARY === 'true';
const USE_SUPABASE_STORAGE = process.env.USE_SUPABASE_STORAGE === 'true' || (!USE_S3 && !USE_CLOUDINARY);

const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || '';
const CLOUDINARY_UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'samara_products';
const SUPABASE_STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'product-images';

export interface UploadResult {
  url: string;
  key?: string;
  publicId?: string;
}

export async function uploadImage(
  file: File,
  folder: 'products' | 'categories' | 'brands'
): Promise<UploadResult> {
  if (USE_S3 && isS3Enabled()) {
    return uploadToS3Client(file, folder);
  } else if (USE_CLOUDINARY) {
    return uploadToCloudinary(file, folder);
  } else {
    return uploadToSupabaseStorage(file, folder);
  }
}

async function uploadToS3Client(
  file: File,
  folder: 'products' | 'categories' | 'brands'
): Promise<UploadResult> {
  const presigned = await generatePresignedUploadUrl(
    folder,
    file.name,
    file.type
  );

  const uploadResponse = await fetch(presigned.uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadResponse.ok) {
    throw new Error('Failed to upload to S3');
  }

  return {
    url: presigned.publicUrl,
    key: presigned.key,
  };
}

async function uploadToCloudinary(
  file: File,
  folder: 'products' | 'categories' | 'brands'
): Promise<UploadResult> {
  if (!CLOUDINARY_CLOUD_NAME) {
    throw new Error('Cloudinary not configured');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', `samara/${folder}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: 'POST',
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error('Failed to upload to Cloudinary');
  }

  const data = await response.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
  };
}

async function uploadToSupabaseStorage(
  file: File,
  folder: 'products' | 'categories' | 'brands'
): Promise<UploadResult> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    throw new Error(`Failed to upload to Supabase Storage: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(SUPABASE_STORAGE_BUCKET)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    key: filePath,
  };
}

export async function deleteImage(url: string): Promise<void> {
  if (USE_S3 && url.includes('cloudfront.net')) {
    // S3 deletion would require extracting the key and using deleteS3Object
    console.log('S3 image deletion not implemented in client');
    return;
  } else if (USE_CLOUDINARY && url.includes('cloudinary.com')) {
    console.log('Cloudinary deletion requires server-side API call');
    return;
  } else {
    // Supabase Storage deletion
    const pathMatch = url.match(/product-images\/(.+)$/);
    if (pathMatch) {
      const filePath = pathMatch[1];
      await supabase.storage.from(SUPABASE_STORAGE_BUCKET).remove([filePath]);
    }
  }
}

export function getStorageProvider(): 'S3' | 'Cloudinary' | 'Supabase' {
  if (USE_S3) return 'S3';
  if (USE_CLOUDINARY) return 'Cloudinary';
  return 'Supabase';
}

export function isStorageConfigured(): boolean {
  return USE_S3 || USE_CLOUDINARY || USE_SUPABASE_STORAGE;
}
