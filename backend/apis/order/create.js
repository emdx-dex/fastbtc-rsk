const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../common/flows');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const web3 = require('web3');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const { btc, flow, rsk, value } = req.body;
  const depositAddress = process.env.BTC_DEPOSIT_ADDRESS;

  if (_.isEmpty(flow)) {
    return res.status(400).json({
      error: 'flow is a required parameter.'
    });
  }

  if (![BTC_TO_RBTC, RBTC_TO_BTC].includes(flow)) {
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
      flow,
      value
    });

    if (flow === BTC_TO_RBTC) {
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
