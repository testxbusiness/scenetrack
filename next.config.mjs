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
  // Configurazione webpack ottimizzata per gestire PDF.js e migliorare il chunking
  webpack: (config, { isServer }) => {
    // Gestisci PDF.js e altri moduli in modo speciale
    if (!isServer) {
      // Assicurati che optimization e splitChunks esistano
      if (!config.optimization) {
        config.optimization = {};
      }
      
      // Configura splitChunks per una migliore gestione dei chunk
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          // Gruppo specifico per PDF.js
          pdfjs: {
            test: /[\\/]node_modules[\\/](pdfjs-dist)[\\/]/,
            name: 'pdfjs',
            priority: 10,
            chunks: 'all',
            enforce: true,
          },
          // Gruppo per le librerie comuni
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name(module) {
              // Ottieni il nome del pacchetto dal percorso del modulo
              const packageName = module.context.match(
                /[\\/]node_modules[\\/](.*?)([\\/]|$)/
              )[1];
              // Crea un nome valido per il chunk
              return `npm.${packageName.replace('@', '')}`;
            },
            priority: 5,
          },
        },
      };
    }
    
    return config;
  },
}

export default nextConfig
