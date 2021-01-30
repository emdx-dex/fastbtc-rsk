module.exports = {
  transpileDependencies: [
    'vuetify'
  ],
  devServer: {
    //open: process.platform === 'darwin',
    //host: '0.0.0.0',
    port: 5556, // CHANGE YOUR PORT HERE!
    //disableHostCheck: true,
    compress: true,
    public: 'fastbtc.emdx.io', // That solved it
    //https: false,
    //hotOnly: false,
  },
  runtimeCompiler: true,
}
