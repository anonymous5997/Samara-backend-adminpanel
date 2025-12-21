/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'wrsrobuicquzpfgnfnmh.supabase.co', // ✅ FIXED
      },
    ],
  },
};

module.exports = nextConfig;
