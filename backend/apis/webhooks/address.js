const _ = require('lodash');
const addressesModel = require('../../models/addresses');
const express = require('express');
const FLOWS = require('../../../shared/flows');
const ordersModel = require('../../models/orders');
const STATUS = require('../../../shared/status');
const { unwatchAddress } = require('../../utils/blocknative');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const {
    blockHeight,
    fee,
    rawTransaction,
    status,
    txid,
    watchedAddress
  } = req.body;

  console.log("\n####### Blocknative webhook received");
  console.log("WatchedAdress:", watchedAddress);
  console.log("Status:", status);
  console.log("TxId:", txid);
  console.log("Block:", blockHeight);
  console.log("####### Webhook end\n");

  try {
    const order = await ordersModel.findOne({
      'btc.address': watchedAddress,
      flow: FLOWS.BTC_TO_RBTC
    });

    // TODO: What happened if user transfer less?
    // const { delta } = netBalanceChanges.find(({ address }) => {
    //   return address.toLowerCase() === watchedAddress;
    // });

    if (_.isEmpty(order)) {
      /**
       * Si no encuentra la orden, igual le devuelvo 200 status al webhook para que no siga llegando.
       * Como la orden no existe más, le hago un unwatch al hook
       */
      console.log(`Order with address: ${watchedAddress} non existant, proceeding to unwatch that address.`)
      await unwatchAddress(watchedAddress);
      return res.sendStatus(200);
    }

    // Se incluyo en el bloque de BTC pero no se mino
    if (status === STATUS.PENDING) {
      order.btc.fee = fee;
      order.btc.rawTransaction = rawTransaction;
      order.btc.status = STATUS.UNCONFIRMED;
      order.btc.txId = txid;
    }

    // Confirmado en blocknative
    if (status === STATUS.CONFIRMED) {
      order.btc.block = blockHeight;
    }

    let addressDoc = await addressesModel.findOne({
      orderId: order._id
    });

    addressDoc.used = true;
    await addressDoc.save();

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = router;
