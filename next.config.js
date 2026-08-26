/** @type {import('next').NextConfig} */
let supabaseImageHost;
try {
  supabaseImageHost = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
    : undefined;
} catch {
  supabaseImageHost = undefined;
}

const nextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 31_536_000,
    remotePatterns: supabaseImageHost
      ? [
          {
            protocol: 'https',
            hostname: supabaseImageHost,
            pathname: '/storage/v1/object/public/listing-photos/**',
          },
        ]
      : [],
  },
  async headers() {
    return [
      {
        source: '/:path*.(svg|png|jpg|jpeg|webp|avif|ico|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
