const list = require('./list');
const sign = require('./sign');

function orderApi(app) {
  app.use('/api/order', list);
  app.use('/api/order', sign);
}

module.exports = orderApi;
