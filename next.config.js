/** @type {import('next').NextConfig} */
const nextConfig = {
  // Оптимизации для production
  compress: true,
  poweredByHeader: false,
  
  // Оптимизация билда
  productionBrowserSourceMaps: false, // Ускоряет билд
  
  // Оптимизация компиляции
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Оставляем только ошибки и предупреждения
    } : false,
  },
  
  images: {
    // Используем только remotePatterns (domains устарела)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
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
