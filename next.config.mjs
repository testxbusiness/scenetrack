/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/a/**',
      },
      {
        protocol: 'https',
        hostname: 'usuavtzeeimlryvqgkyf.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  // Configurazione webpack per gestire PDF.js
  webpack: (config, { isServer }) => {
    // Gestisci PDF.js in modo speciale
    if (!isServer) {
      // Assicurati che optimization e splitChunks esistano
      if (!config.optimization) {
        config.optimization = {};
      }
      if (!config.optimization.splitChunks) {
        config.optimization.splitChunks = {};
      }
      if (!config.optimization.splitChunks.cacheGroups) {
        config.optimization.splitChunks.cacheGroups = {};
      }
      
      // Crea un gruppo di cache specifico per PDF.js
      config.optimization.splitChunks.cacheGroups.pdfjs = {
        test: /[\\/]node_modules[\\/](pdfjs-dist)[\\/]/,
        name: 'pdfjs',
        priority: 10,
        chunks: 'all',
      };
    }
    
    return config;
  },
}

export default nextConfig
