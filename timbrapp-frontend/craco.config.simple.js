// Configurazione minimale per risolvere il problema di avvio
const path = require('path');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

module.exports = {
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
  webpack: {
    configure: (webpackConfig) => {
      // Altre configurazioni webpack
      if (process.env.ANALYZE) {
        webpackConfig.plugins.push(new BundleAnalyzerPlugin());
      }
      return webpackConfig;
    }
  },
  // Configurazione base senza opzioni deprecate
  devServer: function(devServerConfig) {
    return {
      ...devServerConfig,
      port: 3001,
      host: '0.0.0.0',
      open: true,
      https: false,
      proxy: {
        '/api': {
          target: 'http://192.168.1.12:4000',
          pathRewrite: { '^/api': '' },
          changeOrigin: true
        }
      }
    };
  }
};
