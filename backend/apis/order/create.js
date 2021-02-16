const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { BTC, RSK } = require('../../../shared/chains');
const { getAddrNextIndex, deriveAddrByIndex } = require('../../utils/address');
const { getBlockHeight } = require('../../utils/block-height');
const { registerAddress } = require('../../utils/blocknative');
const addressesModel = require('../../models/addresses');
const express = require('express');
const ordersModel = require('../../models/orders');

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const FAST_SWAP_ADDRESS = process.env.FAST_SWAP_ADDRESS;
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const { btc, flow, rsk, value } = req.body;

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

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: 'value is a required parameter.'
    });
  }

  try {
    const order = new ordersModel({
      rsk,
      flow,
      value
    });

    if (flow === BTC_TO_RBTC) {
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
        requiredConfirmations: BTC_BLOCK_HEIGHT_CONFIRMATION
      };
    }

    if (flow === RBTC_TO_BTC) {
      order.btc = {
        ...order.btc,
        ...btc
      };
      order.rsk = {
        ...order.rsk,
        address: FAST_SWAP_ADDRESS,
        confirmations: 0,
        requiredConfirmations: RSK_BLOCK_HEIGHT_CONFIRMATION
      }
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
