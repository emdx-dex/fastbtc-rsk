module.exports = {
  devServer: {
    //host: '0.0.0.0',
    port: 5556, // CHANGE YOUR PORT HERE!
    //disableHostCheck: true,
    compress: true,
    public: 'fastbtc.emdx.io', // That solved it
    //https: false,
    //hotOnly: false,
  },
  transpileDependencies: [
    'vuetify'
  ],
  runtimeCompiler: true,
  outputDir: "../backend/dist"
  /**
   *   devServer: {
    proxy: {
      '^/sockjs-node': {
        target: process.env.VUE_APP_BACKEND_URL,
        ws: true,
        changeOrigin: true
      },
      '^/api': {
        target: process.env.VUE_APP_BACKEND_URL,
        ws: true,
        changeOrigin: true
      },
    },
  },
   */
}
