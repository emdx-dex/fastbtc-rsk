const { BTC_TO_RBTC } = require('../../shared/flows');
const { PENDING } = require('../../shared/status');
const { unwatchAddress } = require('../utils/blocknative');
const ordersModel = require('../models/orders');

require('dotenv').config();
require('../utils/connection');

async function cleanOrder(order) {
  try {
    /**
     * Si el flow es de ida BTC a RBTC, limpio la address del hook de blocknative.
     */
    if (order.flow === BTC_TO_RBTC) {
      let addr = order.btc.address;
      console.log(`Unwatching address: ${addr}`)
      await unwatchAddress(addr);
    }

    order.deleted = true;
    console.log(`Marking as deleted order _id: ${order._id}`);
    await order.save();
  } catch (error) {
    console.log(error);
  }
}

/**
 * Busco ordenes que no estan borradas
 * Que estan en pending
 * el createdAt - now >= 2hs
 * unwatch de la adddr si el flow es btc a rbtc
 * pongo la orden en deleted: true
 */
async function cleanUpOrders() {
  console.log("Running cleanupOrders()");
  try {
    const X = 2;
    const _XHourAgo = new Date(Date.now() - X * 60 * 60 * 1000);

    /**
     * TODO: extender condicion a los 2 estados confirmados y que haya pasado N cantidad de tiempo.
     */
    let orders = await ordersModel.find({
      $and: [
        {
          'btc.status': PENDING,
          'rsk.status': PENDING,
          createdAt: {
            $lt: _XHourAgo
          },
          deleted: false
        }
      ]//TODO: borrar las ya confirmadas ~10 días.
    });

    for (let index = 0; index < orders.length; index++) {
      await cleanOrder(orders[index]);
    }
  } catch (error) {
    console.log(error);
  }
}

module.exports = cleanUpOrders;
