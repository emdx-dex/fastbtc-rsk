module.exports = {
  devServer: {
    //open: process.platform === 'darwin',
    //host: '0.0.0.0',
    port: 5558, // CHANGE YOUR PORT HERE!
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
}
