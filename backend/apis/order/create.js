const _ = require('lodash');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const FLOWS = require('../../utils/flows');
const orderModel = require('../../models/orders');
const STATUS = require('../../utils/status');
const web3 = require('web3');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const { btc, rsk, side, value } = req.body;
  const depositAddress = process.env.BTC_DEPOSIT_ADDRESS;

  if (_.isEmpty(side)) {
    return res.status(400).json({
      error: 'side is a required parameter.'
    });
  }

  if (!Object.values(FLOWS).includes(side)) {
    return res.status(400).json({
      error: 'Choose a valid conversion flow.'
    });
  }

  // TODO: Add validations

  // if (_.isEmpty(rbtcAddress)) {
  //   return res.status(400).json({
  //     error: 'RBTC address is a required parameter.'
  //   });
  // }

  // if (!web3.utils.isAddress(rbtcAddress)) {
  //   return res.status(400).json({
  //     error: 'RBTC address should be a valid RSK address.'
  //   });
  // }

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: 'value is a required parameter.'
    });
  }

  try {
    const order = new orderModel({
      rsk,
      side,
      status: STATUS.OPEN,
      value
    });

    if (side === FLOWS.BTC_TO_RBTC) {
      await registerAddress(depositAddress);

      order.btc = {
        ...order.btc,
        address: depositAddress
      };
    }

    await order.save();

    return res.json({
      data: { order }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
