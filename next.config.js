/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname, // 🔥 THIS fixes "@/lib/*" resolution
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        protocol: 'https',
        hostname: 'wrsrobuicquzpfgnfnmh.supabase.co',
      },
    ],
  },
};

module.exports = nextConfig;
