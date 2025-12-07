import { describe, it, expect, vi, beforeEach } from 'vitest';
import { extractS3KeyFromUrl, getPublicUrlFromKey, isS3Enabled } from '@/lib/aws/s3';

describe('S3 Utility Functions', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  describe('isS3Enabled', () => {
    it('should return false when S3 is not configured', () => {
      expect(isS3Enabled()).toBe(false);
    });
  });

  describe('extractS3KeyFromUrl', () => {
    it('should extract key from CloudFront URL', () => {
      const url = 'https://d1234567890.cloudfront.net/products/image.jpg';
      process.env.AWS_CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';

      const key = extractS3KeyFromUrl(url);
      expect(key).toBe('products/image.jpg');
    });

    it('should extract key from S3 URL', () => {
      const url = 'https://my-bucket.s3.ap-south-1.amazonaws.com/products/test.png';
      process.env.AWS_S3_BUCKET = 'my-bucket';

      const key = extractS3KeyFromUrl(url);
      expect(key).toBe('products/test.png');
    });

    it('should return null for invalid URL', () => {
      const url = 'https://example.com/image.jpg';
      const key = extractS3KeyFromUrl(url);
      expect(key).toBeNull();
    });

    it('should return null for empty URL', () => {
      const key = extractS3KeyFromUrl('');
      expect(key).toBeNull();
    });
  });

  describe('getPublicUrlFromKey', () => {
    it('should generate CloudFront URL when domain is set', () => {
      process.env.AWS_CLOUDFRONT_DOMAIN = 'd1234567890.cloudfront.net';

      const url = getPublicUrlFromKey('products/test.jpg');
      expect(url).toBe('https://d1234567890.cloudfront.net/products/test.jpg');
    });

    it('should generate S3 URL when CloudFront domain is not set', () => {
      process.env.AWS_CLOUDFRONT_DOMAIN = '';
      process.env.AWS_S3_BUCKET = 'my-bucket';
      process.env.AWS_REGION = 'ap-south-1';

      const url = getPublicUrlFromKey('products/test.jpg');
      expect(url).toBe('https://my-bucket.s3.ap-south-1.amazonaws.com/products/test.jpg');
    });
  });
});
