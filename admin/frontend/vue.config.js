module.exports = {
  devServer: {
    //open: process.platform === 'darwin',
    //host: '0.0.0.0',
    port: 5558, // CHANGE YOUR PORT HERE!
    //disableHostCheck: true,
    compress: true,
    public: 'fastbtc.emdx.io', // That solved it
    proxy: {
      '^/sockjs-node': {
        target: process.env.VUE_APP_BACKEND_URL,
        ws: true,
        changeOrigin: true
      }
    },
  },
  transpileDependencies: [
    'vuetify'
  ],
  runtimeCompiler: true,
  outputDir: "../backend/dist"
}
