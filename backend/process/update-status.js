const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, UNCONFIRMED } = require('../../shared/status');
const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const { unwatchAddress } = require('../utils/blocknative');
const bitcoinjs = require('bitcoinjs-lib');
const ordersModel = require('../models/orders');
const { createAndSignTx, getTxInfo, getBTCTxConfirmations, relaySignedTx } = require('../utils/transaction');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION);
const RSK_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.RSK_BLOCK_HEIGHT_CONFIRMATION);

async function checkConfirmations(chain, height, heightConfirmation, order) {
  const blockDelta = order[chain].block ? height - order[chain].block : 0;
  const status = (blockDelta >= heightConfirmation) ? CONFIRMED : order[chain].status;

  if (order[chain].status !== CONFIRMED && status === CONFIRMED) {
    console.log(`Confirming. Id: ${order.id}. Chain: ${chain}`);

    order[chain].status = CONFIRMED;

    if (order.flow === BTC_TO_RBTC) {
      if (chain === RSK && _.isEmpty(order.rsk.txId)) {
        console.log(`Sending transaction. Id: ${order.id}.`);

        // TODO: chequear porque esta tx es secuencial y depende de la confirmación del nonce.
        const { receipt } = await swapIn(order.rsk.address, order.value);

        // TODO: Para confirmar la orden debería escuchar el transaction hash.
        order.rsk.block = receipt.blockNumber;
        order.rsk.status = CONFIRMED;
        order.rsk.txId = receipt.transactionHash;

      }
      if (chain === BTC) {
        await unwatchAddress(order.btc.address);
      }
    }

    //RBTC -> BTC FLOW
    if (order.flow === RBTC_TO_BTC) {
      /* 
        Esto triggerea cuando del lado de RSK se confirma la tx al contrato pero todavia no se hizo la tx del lado de BTC
      */
      if (chain === RSK && _.isEmpty(order.btc.txId)) {
        order.rsk.status = CONFIRMED;

        let _FROM = process.env.BTC_HOT_WALLET_ADDR;
        let _TO = order.btc.address;
        let _VALUE_SATS = order.value * 100000000;
        let _PRIVKEY = process.env.BTC_HOT_WALLET_PRIVKEY;

        let network = bitcoinjs.networks.testnet;
        const RSKKeypair = bitcoinjs.ECPair.fromWIF(
          _PRIVKEY,
          network
        );

        let createdSignedTx = await createAndSignTx(_FROM, _TO, _VALUE_SATS, RSKKeypair);


        if (!createdSignedTx.signedRawTx) {
          console.log(createdSignedTx);

          throw "Error creating signedRawTx";
        }

        let broadcastedTxId = await relaySignedTx(createdSignedTx.signedRawTx);

        if (!broadcastedTxId) {
          console.log(broadcastedTxId);

          throw "Error broadcasting transaction";
        }

        order.btc.txId = broadcastedTxId;
      }
    }
  }

  /* 
    Una vez que la tx del lado de RSK está confirmado y ya mandamos la tx del lado de BTC, esperamos las confirmaciones como está definido del lado del ENV.
  */
  //TODO: Esto no se ejecuta porque el find en el updateStatus() es uncofirmed
  if (order.flow === RBTC_TO_BTC && order.rsk.status === CONFIRMED && order.btc.txId) {
    let confirmations = await getBTCTxConfirmations(order.btc.txId);
    if (confirmations >= process.env.BTC_BLOCK_HEIGHT_CONFIRMATION)
      order.btc.status = CONFIRMED;
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
      .then(() => { })
      .catch((error) => {
        console.log(error);
        //process.exit(1);
      })
      .finally(() => {
        console.log('Finish update process.');
      });

  } catch (error) {
    console.log(`[ERROR] Update status cron: ${error}`);
    //process.exit(1);
  }
}

// TODO: revisar que el tiempo sea optimo por cada chain.
(async function () {
  require('../utils/connection');
  await updateStatus();

  setInterval(async () => {
    await updateStatus();
  }, 60000)
}());

module.exports = {
  updateStatus
};
