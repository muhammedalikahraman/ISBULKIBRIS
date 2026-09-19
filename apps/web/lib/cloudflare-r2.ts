/**
 * Cloudflare R2 Storage Integration
 * 
 * This module handles file uploads to Cloudflare R2 instead of Supabase Storage
 * for better performance and cost optimization.
 */

interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
}

interface UploadResult {
  key: string;
  url: string;
  etag?: string;
}

/**
 * Generate signed URL for R2 upload
 */
export function generateR2UploadUrl(
  key: string,
  contentType: string,
  expiresIn: number = 3600
): string {
  const config = getR2Config();
  if (!config) {
    throw new Error('Cloudflare R2 configuration missing');
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const region = 'auto';
  
  // Create canonical request
  const canonicalRequest = `PUT\n${contentType}\n\nx-amz-date:${timestamp}\n/${key}`;
  
  // Create string to sign
  const stringToSign = `AWS4-HMAC-SHA256\n${timestamp}\n${region}/s3/aws4_request\n${canonicalRequest}`;
  
  // Note: In production, use AWS SDK or proper crypto signing
  // This is a simplified version for demonstration
  const signature = Buffer.from(stringToSign).toString('base64');
  
  const url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
  
  return url;
}

/**
 * Get R2 configuration from environment variables
 */
function getR2Config(): R2Config | null {
  const accountId = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_ACCESS_KEY;
  const secretAccessKey = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_SECRET_KEY;
  const bucket = process.env.NEXT_PUBLIC_CLOUDFLARE_R2_BUCKET;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
    return null;
  }

  return { accountId, accessKeyId, secretAccessKey, bucket };
}

/**
 * Upload file to Cloudflare R2
 */
export async function uploadToR2(
  file: File,
  key: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> {
  const config = getR2Config();
  if (!config) {
    throw new Error('Cloudflare R2 configuration missing');
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await fetch(
      `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
          'Authorization': `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${new Date().toISOString().slice(0, 10)}/auto/s3/aws4_request, SignedHeaders=content-type;x-amz-date, Signature=${generateSignature(config, key, file.type)}`,
        },
        body: file,
      }
    );

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    const etag = response.headers.get('ETag');
    const url = `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;

    return { key, url, etag: etag || undefined };
  } catch (error) {
    console.error('R2 upload error:', error);
    throw error;
  }
}

/**
 * Generate AWS Signature V4 (simplified)
 */
function generateSignature(config: R2Config, key: string, contentType: string): string {
  // In production, use AWS SDK v3 or proper crypto implementation
  // This is a placeholder for demonstration
  const stringToSign = `${config.accessKeyId}\n${key}\n${contentType}\n${Date.now()}`;
  return Buffer.from(stringToSign).toString('base64');
}

/**
 * Delete file from Cloudflare R2
 */
export async function deleteFromR2(key: string): Promise<void> {
  const config = getR2Config();
  if (!config) {
    throw new Error('Cloudflare R2 configuration missing');
  }

  const response = await fetch(
    `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`,
    {
      method: 'DELETE',
      headers: {
        'Authorization': `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}/${new Date().toISOString().slice(0, 10)}/auto/s3/aws4_request, SignedHeaders=host;x-amz-date, Signature=${generateSignature(config, key, '')}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Delete failed: ${response.statusText}`);
  }
}

/**
 * Get public URL for R2 file
 */
export function getR2PublicUrl(key: string): string {
  const config = getR2Config();
  if (!config) {
    throw new Error('Cloudflare R2 configuration missing');
  }

  return `https://${config.accountId}.r2.cloudflarestorage.com/${config.bucket}/${key}`;
}

/**
 * Check if R2 is configured
 */
export function isR2Configured(): boolean {
  return getR2Config() !== null;
}

/**
 * Generate unique file key
 */
export function generateFileKey(userId: string, fileType: 'avatar' | 'cv' | 'logo' | 'document', originalName: string): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalName.split('.').pop();
  return `${fileType}/${userId}/${timestamp}-${randomString}.${extension}`;
}