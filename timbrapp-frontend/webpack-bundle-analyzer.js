// Script per analisi bundle size
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Aggiungi bundle analyzer solo in modalità analyze
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(
          new BundleAnalyzerPlugin({
            analyzerMode: 'server',
            openAnalyzer: true,
          })
        );
      }

      // Ottimizzazione code splitting
      webpackConfig.optimization.splitChunks = {
        chunks: 'all',
        minSize: 20000,
        maxSize: 244000,
        cacheGroups: {
          default: {
            minChunks: 2,
            priority: -20,
            reuseExistingChunk: true
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: -10,
            chunks: 'all'
          },
          mui: {
            test: /[\\/]node_modules[\\/]@mui[\\/]/,
            name: 'mui-vendor',
            priority: 10,
            chunks: 'all'
          },
          fullcalendar: {
            test: /[\\/]node_modules[\\/]@fullcalendar[\\/]/,
            name: 'fullcalendar-vendor',
            priority: 10,
            chunks: 'all'
          },
          workbox: {
            test: /[\\/]node_modules[\\/]workbox-[\\/]/,
            name: 'workbox-vendor',
            priority: 10,
            chunks: 'all'
          }
        }
      };

      // Tree shaking più aggressivo
      webpackConfig.optimization.usedExports = true;
      webpackConfig.optimization.sideEffects = false;

      return webpackConfig;
    }
  }
};
