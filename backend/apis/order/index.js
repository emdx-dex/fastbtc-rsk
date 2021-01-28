const create = require('./create');

function orderApi(app) {
  app.use('/order', create);
}

module.exports = orderApi;
