const get = require('./get');
const list = require('./list');
const order = require('./order');

function orderApi(app) {
  app.use('/api/order', get);
  app.use('/api/order', list);
  app.use('/api/order', order);
}

module.exports = orderApi;
