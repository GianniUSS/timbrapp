// Top of file: override util._extend deprecation
const util = require('util');
if (util._extend) util._extend = Object.assign;

// Configurazione ottimizzata per risolvere i problemi di avvio
const path = require('path');
// Rimosso temporaneamente per evitare errori di build
// const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  style: {
    postcss: {
      // Configurazione PostCSS integrata per una migliore compatibilità
      mode: 'extends',
      loaderOptions: (postcssLoaderOptions) => {
        postcssLoaderOptions.postcssOptions = {
          config: path.resolve(__dirname, 'postcss.config.compatibility.js'),
          sourceMap: true
        };
        return postcssLoaderOptions;
      },
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Analisi bundle disabilitata per risolvere problemi di build
      // if (process.env.ANALYZE) {
      //   webpackConfig.plugins.push(new BundleAnalyzerPlugin());
      // }
      return webpackConfig;
    }  },
  // Configurazione base senza opzioni deprecate  
  devServer: function(devServerConfig) {
    return {
      ...devServerConfig,
      setupMiddlewares: devServerConfig.setupMiddlewares,
      port: 3000,
      host: 'localhost',
      open: true,
      https: false,
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true
        }
      }
    };
  }
};
