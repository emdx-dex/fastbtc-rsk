const _ = require('lodash');
const { BTC_TO_RBTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, PENDING, UNCONFIRMED } = require('../../shared/status');
const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const cron = require('node-cron');
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

      const { receipt } = await swapIn(order.rsk.address, order.value);

      order.rsk.block = receipt.blockNumber;
      order.rsk.status = CONFIRMED;
      order.rsk.txId = receipt.transactionHash;
    }

    await order.save();
  }
}

async function updateStatus() {
  require('../utils/connection');

  try {
    const orders = await ordersModel.find({
      '$or': [
        { 'btc.status': PENDING },
        { 'btc.status': UNCONFIRMED },
        { 'rsk.status': PENDING },
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

updateStatus();

// This run the cron every minute.
// const task = cron.schedule('* * * * *', updateStatus);

// task.start();




