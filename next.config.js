/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизации для production
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация билда
  swcMinify: true,
  productionBrowserSourceMaps: false, // Ускоряет билд
  
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  
  // Увеличение лимитов для долгих операций (генерация изображений)
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
