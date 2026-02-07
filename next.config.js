/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизации для production
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация билда
  productionBrowserSourceMaps: false, // Ускоряет билд
  swcMinify: true, // Используем SWC для минификации (быстрее)
  
  // Оптимизация компиляции
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Оставляем только ошибки и предупреждения
    } : false,
  },
  
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
    // Оптимизация для production
    optimizePackageImports: ['@prisma/client', 'lucide-react'],
  },
  
  // Оптимизация webpack
  webpack: (config, { isServer }) => {
    // Ускоряем сборку
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        moduleIds: 'deterministic',
      };
    }
    return config;
  },
};

module.exports = nextConfig;
