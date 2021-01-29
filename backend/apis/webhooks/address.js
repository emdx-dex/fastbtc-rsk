const _ = require('lodash');
const express = require('express');
const orderModel = require('../../models/orders');
const STATUS = require('../../utils/status');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const {
    blockHeight,
    status,
    txid,
    watchedAddress
  } = req.body;

  console.log(req.body);

  try {
    const order = await orderModel.findOne({ btcDepositAddress: watchedAddress });

    // TODO: What happened if user trasnfer less?
    // const { delta } = netBalanceChanges.find(({ address }) => {
    //   return address.toLowerCase() === watchedAddress;
    // });

    if (_.isEmpty(order)) {
      return res.sendStatus(500);
    }

    if (status === STATUS.PENDING) {
      order.status = status;
      order.txId = txid;
    }

    if (status === STATUS.CONFIRMED) {
      order.block = blockHeight;
      order.status = status;
    }

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

module.exports = router;
