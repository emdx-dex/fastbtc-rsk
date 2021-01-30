const _ = require('lodash');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const STATUS = require('../../utils/status');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const { rbtcAddress, value } = req.body;
  const depositAddress = process.env.BTC_DEPOSIT_ADDRESS;

  // TODO: Validate this is a RBTC address.
  if (_.isEmpty(rbtcAddress)) {
    return res.status(400).json({
      error: '\'rbtcAddress\' is a required parameter.'
    });
  }

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: '\'value\' is a required parameter.'
    });
  }

  try {
    const message = await registerAddress(depositAddress);
    const order = new orderModel({
      btcDepositAddress: depositAddress,
      rbtcTransferAddress: rbtcAddress,
      status: STATUS.OPEN,
      value
    });

    await order.save();

    return res.json({
      data: { order }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
