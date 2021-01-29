const create = require('./create');

function orderApi(app) {
  app.use('/api/order', create);
}

module.exports = orderApi;
