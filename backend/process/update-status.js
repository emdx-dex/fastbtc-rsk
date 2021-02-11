const _ = require('lodash');
const { BTC_TO_RBTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, UNCONFIRMED } = require('../../shared/status');
const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const { unwatchAddress } = require('../utils/blocknative');
const ordersModel = require('../models/orders');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION);
const RSK_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.RSK_BLOCK_HEIGHT_CONFIRMATION);

async function checkConfirmations(chain, height, heightConfirmation, order) {
  const blockDelta = order[chain].block ? height - order[chain].block : 0;
  const status = (blockDelta >= heightConfirmation) ? CONFIRMED : order[chain].status;

  if (order[chain].status !== CONFIRMED && status === CONFIRMED) {
    console.log(`Confirming. Id: ${order.id}. Chain: ${chain}`);

    order[chain].status = CONFIRMED;

    if (order.flow === BTC_TO_RBTC && chain === RSK && _.isEmpty(order.rsk.txId)) {
      console.log(`Sending transaction. Id: ${order.id}.`);

      //TODO: chequear porque esta tx es secuencial y depende de la confirmación del nonce.
      const { receipt } = await swapIn(order.rsk.address, order.value);

      order.rsk.block = receipt.blockNumber;
      order.rsk.status = CONFIRMED;
      order.rsk.txId = receipt.transactionHash;
    }

    if (order.flow === BTC_TO_RBTC && chain === BTC) {
      await unwatchAddress(order.btc.address);
    }
  }
}

async function updateStatus() {
  console.log('Running update process...');

  try {
    const orders = await ordersModel.find({
      '$or': [
        { 'btc.status': UNCONFIRMED },
        { 'rsk.status': UNCONFIRMED }
      ]
    });
    const btcBlockHeight = await getBlockNumber();
    const rskBlockHeight = await getRSKBlockNumber();
    const promises = orders.map((order) => {
      return new Promise(async (resolve, reject) => {
        try {
          await checkConfirmations(BTC, btcBlockHeight, BTC_BLOCK_HEIGHT_CONFIRMATION, order);
          await checkConfirmations(RSK, rskBlockHeight, RSK_BLOCK_HEIGHT_CONFIRMATION, order);
          await order.save();

          resolve();
        } catch (error) {
          reject(error);
        }
      })
    });

    Promise
      .all(promises)
      .then(() => {
        process.exit(0);
      })
      .catch((error) => {
        console.log(error);
        process.exit(1);
      });

  } catch (error) {
    console.log(`[ERROR] Update status cron: ${error}`);
  }
}

// TODO: revisar que el tiempo sea optimo por cada chain.
(async function () {
  require('../utils/connection');

  setInterval(async () => {
    await updateStatus();
  }, 60000)
}());

module.exports = {
  updateStatus
};
