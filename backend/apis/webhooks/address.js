const _ = require('lodash');
const express = require('express');
const FLOWS = require('../../../shared/flows');
const orderModel = require('../../models/orders');
const STATUS = require('../../../shared/status');

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

  console.log(req.body);

  try {
    const order = await orderModel.findOne({
      'btc.address': watchedAddress,
      flow: FLOWS.BTC_TO_RBTC
    });

    // TODO: What happened if user trasnfer less?
    // const { delta } = netBalanceChanges.find(({ address }) => {
    //   return address.toLowerCase() === watchedAddress;
    // });

    if (_.isEmpty(order)) {
      return res.sendStatus(404);
    }

    if (status === STATUS.PENDING) {
      order.btc.fee = fee;
      order.btc.rawTransaction = rawTransaction;
      order.btc.status = status;
      order.btc.txId = txid;
    }

    if (status === STATUS.CONFIRMED) {
      order.btc.block = blockHeight;
      order.btc.status = STATUS.UNCONFIRMED;
    }

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    console.log(error);
    return res.sendStatus(500);
  }
});

module.exports = router;
