const create = require('./create');
const get = require('./get');
const list = require('./list');

function orderApi(app) {
  app.use('/api/order', create);
  app.use('/api/order', get);
  //app.use('/api/order', list); __ DISBLED TO PREVENT CUSTOMER TO GET LIST OF ORDERS.
}

module.exports = orderApi;
