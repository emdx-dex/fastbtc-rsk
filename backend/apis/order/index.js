const create = require('./create');
const list = require('./list');

function orderApi(app) {
  app.use('/api/order', create);
  app.use('/api/order', list);
}

module.exports = orderApi;
