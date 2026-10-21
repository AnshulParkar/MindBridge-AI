import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable if needed
  },
  images: {
    domains: [], // Add any external image domains you're using
    unoptimized: true, // Temporarily disable Next.js image optimization
  },
  // Optimize for production
  poweredByHeader: false,
  compress: true,
  // Configure for deployment
  trailingSlash: false,
  // Environment-specific optimizations
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  // Allow ngrok and external access
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS, PATCH',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, Content-Type, Authorization',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
