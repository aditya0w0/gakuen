import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Performance optimizations
  experimental: {
    optimizeCss: true, // CSS optimization
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
  },

  // Compression
  compress: true,

  // PoweredBy header (security)
  poweredByHeader: false,

  // Headers for caching and security
  async headers() {
    return [
      {
        // Static assets - long cache
        source: '/:all*(svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // JS/CSS bundles
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // API routes - short cache with revalidation
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'private, no-cache, no-store, must-revalidate',
          },
        ],
      },
      {
        // Security headers for all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Bundle analyzer (optional - enable to analyze)
  // webpack: (config, { isServer }) => {
  //     if (process.env.ANALYZE === 'true') {
  //         const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
  //         config.plugins.push(
  //             new BundleAnalyzerPlugin({
  //                 analyzerMode: 'static',
  //                 reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
  //             })
  //         );
  //     }
  //     return config;
  // },
};

export default nextConfig;
