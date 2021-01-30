const _ = require('lodash');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const STATUS = require('../../utils/status');
const web3 = require('web3');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const { rbtcAddress, value } = req.body;
  const depositAddress = process.env.BTC_DEPOSIT_ADDRESS;

  if (_.isEmpty(rbtcAddress)) {
    return res.status(400).json({
      error: 'RBTC address is a required parameter.'
    });
  }

  if (!web3.utils.isAddress(rbtcAddress)) {
    return res.status(400).json({
      error: 'RBTC address should be a valid RSK address.'
    });
  }

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: 'value is a required parameter.'
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
