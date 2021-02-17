const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../shared/flows');
const { BTC, RSK } = require('../../shared/chains');
const { CONFIRMED, FAILED, UNCONFIRMED, SIGNATURE_PENDING, PENDING } = require('../../shared/status');
const { createAndSignTx, getBTCTxConfirmations, relaySignedTx, createUnsignedRawtx } = require('../utils/transaction');
const { getBlockHeight } = require('../utils/block-height');
const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber, getTransactionReceipt } = require('../rsk/index');
const { swapIn } = require('../rsk/index');
const { unwatchAddress } = require('../utils/blocknative');
const bitcoinjs = require('bitcoinjs-lib');
const ordersModel = require('../models/orders');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);

async function checkConfirmations(chain, height, heightConfirmation, order) {
  // El block delta en -1 es para cuando no está definido el block en una chain.
  const blockDelta = order[chain].block ? height - order[chain].block : -1;
  const status = (blockDelta >= heightConfirmation) ? CONFIRMED : order[chain].status;

  if (order[chain].status !== CONFIRMED && status === CONFIRMED) {
    if (order.flow === BTC_TO_RBTC) {
      if (chain === BTC && _.isEmpty(order.rsk.txId)) {
        console.log(`Confirming. Id: ${order.id}. Chain: ${chain}`);

        order.btc.status = CONFIRMED;

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
        console.log(`Confirming. Id: ${order.id}. Chain: ${chain}`);

        order.rsk.status = CONFIRMED;

        /* 
          automatico	hot_wallet 0.02
          manual	hot_wallet 0.1
          multi-sig	0.2
        */
        const BTC_UNIT = 100000000;
        let network = bitcoinjs.networks.testnet;
        let _VALUE_BTC = order.value;
        let _VALUE_SATS = order.value * BTC_UNIT;//TODO: proper handle of stas.
        let _TO = order.btc.address;
        /**
         * Si el valor total de la orden es menor a 0.02 se puede hacer la
         * firma y relay automático de la tx
         */
        if (_VALUE_BTC <= 0.02) {

          try {

            //Uso la HOT_WALLET definida en .ENV como origen de los fondos.
            let _FROM = process.env.BTC_HOT_WALLET_ADDR;
            let _PRIVKEY = process.env.BTC_HOT_WALLET_PRIVKEY;

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

          } catch (error) {
            console.log(error);
            throw ("Error creating or relaying signed transaction")
          }

          /**
           * Si el order.value es mayor a 0.02 y menor o igual a 0.1 
           * entonces también sale desde la hotwallet pero se guarda la 
           * rawHex cruda en base, se ĺevantará después de Electrum u otra 
           * wallet para confirmar valores, revisar tx en general, firmar y 
           * enviar.
           */
        } else if (_VALUE_BTC > 0.02 && _VALUE_BTC <= 0.1) {

          try {

            let _FROM = process.env.BTC_HOT_WALLET_ADDR;

            let unsignedRawHexTx = await createUnsignedRawtx(
              _FROM,
              _TO,
              _VALUE_SATS
            );

            order.btc.status = SIGNATURE_PENDING;
            order.btc.unsignedRawHexTx = unsignedRawHexTx;
            /**
             * Endpoint backen para setear txId;
             */

          } catch (error) {
            console.log(error);
            throw ("Error creating unsignedRawTx");
          }

          /**
           * Si el order.value es mayor a 0.1 entonces directamente tiene que pasar por multisig.
           */
        } else if (_VALUE_BTC > 0.1) {

          /**
           * Acá hay un tema: cómo manejar los UTXO de los fondos, porque al no ser una address particular hay que escanear todos los UTXOs asociados a todas las direcciones derivadas que alguna vez recibieron fondos.
           * 
           * Se dispara alerta en Telegram y se maneja desde adentro de 
           */
          order.btc.status = MULTISIG_PENDING;

        }


      }// if chain === RSK && _.isEmpty(order.btc.txId))

    }// if order.flow === RBTC_TO_BTC

  }// if (order[chain].status !== CONFIRMED && status === CONFIRMED)

}// function checkConfirmations();

async function updateStatus() {
  console.log('Running update process...');

  try {
    const orders = await ordersModel.find({
      '$or': [
        { 'btc.status': UNCONFIRMED },
        { 'btc.status': SIGNATURE_PENDING },
        { 'btc.status': MULTISIG_PENDING },
        { 'rsk.status': UNCONFIRMED }
      ],
      deleted: false
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

            if (!_.isEmpty(receipt)) {
              order.rsk.block = blockNumber;
              order.rsk.status = (status) ?
                ((rskBlockHeight - blockNumber) >= RSK_BLOCK_HEIGHT_CONFIRMATION) ? CONFIRMED : UNCONFIRMED
                : FAILED;
            } else {
              order.rsk.status = UNCONFIRMED;
            }
          }

          /* 
            Una vez que la tx del lado de RSK está confirmado y ya mandamos la tx del lado de BTC, esperamos las confirmaciones como está definido del lado del ENV.
          */
          if (
            order.flow === RBTC_TO_BTC &&
            order.rsk.status === CONFIRMED &&
            order.btc.status === UNCONFIRMED &&
            order.btc.txId
          ) {//caso 1 order value con txSigned hot_wallet y relay automático.
            const confirmations = await getBTCTxConfirmations(order.btc.txId);

            if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
              order.btc.status = CONFIRMED;
            }
          } else if (//caso 2: order value unsignedRawtx desde hot_wallet sin relay automático.
            order.flow === RBTC_TO_BTC &&
            order.rsk.status === CONFIRMED &&
            order.btc.status === SIGNATURE_PENDING
          ) {

            /**
             * Si order.btc.txId es null quiere decir que el admin/operador no hizo la tx todavia y no tiene sentido chequear las confirmaciones.
             */
            if (!order.btc.txId)
              return;

            /**
             * Disparar alerta a grupo Telegram con:
             * order.btc.status
             * order.btc.value
             * order.btc.unsignedRawHexTx;
             */

            //telegramSendAlert();

            let confirmations = await getBTCTxConfirmations(order.btc.txId);
            if (confirmations >= BTC_BLOCK_HEIGHT_CONFIRMATION) {
              order.btc.status = CONFIRMED;
            }

          } else if (//caso 3: order value desde MULTISIG
            order.flow === RBTC_TO_BTC &&
            order.rsk.status === CONFIRMED &&
            order.btc.status === MULTISIG_PENDING
          ) {

            /**
             * Si order.btc.txId es null quiere decir que el admin/operador no hizo la tx todavia y no tiene sentido chequear las confirmaciones.
             */
            if (!order.btc.txId)
              return;

            /**
             * Disparar alerta a grupo Telegram con:
             * order.btc.status
             * order.btc.address (es el TO);
             * order.btc.value
             */

            //telegramSendAlert();

            let confirmations = await getBTCTxConfirmations(order.btc.txId);
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

async function cleanUpOrders() {

  /**
   * Busco ordenes que no estan borradas
   * Que estan en pending
   * el createdAt - now >= 2hs
   * unwatch de la adddr si el flow es btc a rbtc
   * pongo la orden en deleted: true
   */

  const _1HourAgo = new Date(Date.now() - 60 * 60 * 1000);

  let orders = await ordersModel.find({
    $and: [
      {
        'btc.status': PENDING,
        'rsk.status': PENDING,
        createdAt: {
          $lt: _1HourAgo
        }
      }
    ]
  });
  console.log(orders);
  return;

}

// TODO: revisar que el tiempo sea optimo por cada chain.
(async function () {
  require('../utils/connection');

  const ONE_MINUTE_IN_MILISECONDS = 60000;

  //await updateStatus();
  //await cleanUpOrders();
  await cleanUpOrders();
  setInterval(async () => {
    //await updateStatus();
    await cleanUpOrders();
  }, ONE_MINUTE_IN_MILISECONDS);
}());

module.exports = {
  updateStatus
};
