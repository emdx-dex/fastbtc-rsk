const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, FAILED, UNCONFIRMED } = require('../../shared/status');
const { createAndSignTx, getBTCTxConfirmations, relaySignedTx } = require('../utils/transaction');
const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber, getTransactionReceipt } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const { unwatchAddress } = require('../utils/blocknative');
const bitcoinjs = require('bitcoinjs-lib');
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

    if (order.flow === BTC_TO_RBTC) {
      if (chain === BTC && _.isEmpty(order.rsk.txId)) {
        await unwatchAddress(order.btc.address);

        console.log(`Sending transaction. Id: ${order.id}.`);

        // TODO: chequear porque esta tx es secuencial y depende de la confirmación del nonce.
        const transactionHash = await swapIn(order.rsk.address, order.value);

        order.rsk.status = UNCONFIRMED;
        order.rsk.txId = transactionHash;
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

          throw 'Error creating signedRawTx';
        }

        let broadcastedTxId = await relaySignedTx(createdSignedTx.signedRawTx);

        if (!broadcastedTxId) {
          console.log(broadcastedTxId);

          throw 'Error broadcasting transaction';
        }

        order.btc.txId = broadcastedTxId;
        order.btc.status = UNCONFIRMED;
      }
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

          if (
            order.flow === BTC_TO_RBTC &&
            order.btc.status === CONFIRMED &&
            order.rsk.status === UNCONFIRMED &&
            order.rsk.txId
          ) {
            const receipt = await getTransactionReceipt(order.rsk.txId);
            const blockNumber = _.get(receipt, 'blockNumber');
            const status = _.get(receipt, 'status');


            order.rsk.block = blockNumber;
            order.rsk.status = (status) ?
              ((rskBlockHeight - blockNumber) >= RSK_BLOCK_HEIGHT_CONFIRMATION) ? CONFIRMED : UNCONFIRMED
              : FAILED;
          }

          /* 
            Una vez que la tx del lado de RSK está confirmado y ya mandamos la tx del lado de BTC, esperamos las confirmaciones como está definido del lado del ENV.
          */
          if (
            order.flow === RBTC_TO_BTC &&
            order.rsk.status === CONFIRMED &&
            order.btc.status === UNCONFIRMED &&
            order.btc.txId
          ) {
            const confirmations = await getBTCTxConfirmations(order.btc.txId);

            if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
              order.btc.status = CONFIRMED;
            }
          }

          resolve();
        } catch (error) {
          reject(error);
        } finally {
          await order.save();
        }
      });
    });

    Promise
      .all(promises)
      .then(() => { })
      .catch((error) => {
        console.log(error);
      })
      .finally(() => {
        console.log('Finish update process.');
      });

  } catch (error) {
    console.log(`[ERROR] Update status cron: ${error}`);
  }
}

// TODO: revisar que el tiempo sea optimo por cada chain.
(async function () {
  require('../utils/connection');

  const ONE_MINUTE_IN_MILISECONDS = 60000;

  await updateStatus();

  setInterval(async () => {
    await updateStatus();
  }, ONE_MINUTE_IN_MILISECONDS);
}());

module.exports = {
  updateStatus
};
