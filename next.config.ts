import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: false,

  // Performance optimizations
  experimental: {
    optimizeCss: true, // CSS optimization
    serverActions: {
      bodySizeLimit: '35mb', // Allow up to 35MB uploads (with some buffer)
    },
  },

  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    // Allow unoptimized images from /api/images proxy (Google Drive content)
    unoptimized: false,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.google.com',
      },
      {
        protocol: 'https',
        hostname: '**.gstatic.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
      },
      // Allow R2 storage if configured
      ...(process.env.R2_PUBLIC_URL
        ? [
            {
              protocol: 'https' as const,
              hostname: new URL(process.env.R2_PUBLIC_URL).hostname,
            },
          ]
        : []),
    ],
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
        // HTML pages - no cache (critical for fresh UI after deployments)
        source:
          '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|jpg|jpeg|png|gif|ico|webp|avif|woff|woff2)).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
      {
        // Image serving API - enable caching (30 days)
        source: '/api/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=2592000, stale-while-revalidate=2592000',
          },
        ],
      },
      {
        // API routes - short cache with revalidation (except images)
        source: '/api/((?!images).*)',
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
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          // XSS Protection (legacy but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Permissions Policy - restrict browser features
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS - enforce HTTPS in production
          ...(process.env.NODE_ENV === 'production'
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains',
                },
              ]
            : []),
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://accounts.google.com https://www.gstatic.com", // Added Google APIs for auth
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: blob: https: http:", // Allow all HTTPS/HTTP images - FluidEditor auto-uploads external images to our server
              "connect-src 'self' https://*.googleapis.com https://*.googleusercontent.com https://lh3.googleusercontent.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com https://accounts.google.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com",
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://accounts.google.com https://*.firebaseapp.com",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join('; '),
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

  // Rewrites for legacy URL compatibility
  async rewrites() {
    return [
      {
        // Fix legacy avatar URLs that have /public/ prefix
        source: '/public/uploads/:path*',
        destination: '/uploads/:path*',
      },
    ];
  },
};

export default nextConfig;
