const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const addressesModel = require('../../models/addresses');
const {getAddrNextIndex, deriveAddrByIndex} = require('../../utils/address');

const web3 = require('web3');
const ordersModel = require('../../models/orders');

const BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

require('dotenv').config();


router.post('/', async (req, res) => {
  const { btc, flow, rsk, value } = req.body;
  //const depositAddress = process.env.BTC_DEPOSIT_ADDRESS_TESTNET;

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

      //getAddrNextIndex, deriveAddrByIndex
      let idx = await getAddrNextIndex();

      let depositAddr = deriveAddrByIndex(idx);

      let newAddrDoc = new addressesModel();

      newAddrDoc.orderId = order._id;
      
      newAddrDoc.address = depositAddr;
      newAddrDoc.deriveAddrByIndex = idx;

      await newAddrDoc.save();
      
      await registerAddress(depositAddr);

      order.btc = {
        ...order.btc,
        address: depositAddr,
        confirmations: 0,
        requiredConfirmations: BLOCK_HEIGHT_CONFIRMATION
      };
    }

    if (flow === RBTC_TO_BTC) {
      await registerAddress(depositAddress);

      order.btc = {
        ...order.btc,
        ...btc
      };
    }

    await order.save();

    return res.json({
      data: { order }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

module.exports = router;
