const { merge } = require('webpack-merge')
const common = require('./webpack.common.js')

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    host: '0.0.0.0', // Allow access from external devices
    open: false, // Don't auto-open browser in container
    port: 8090,
    allowedHosts: 'all', // Allow all hosts (required for Codespaces)
    client: {
      overlay: true // Show application errors
    },
    historyApiFallback: {
      index: 'index.html'
    },
    static: './public'
  },
  devtool: 'inline-source-map'
})
