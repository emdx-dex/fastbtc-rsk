const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { BTC, RSK } = require('../../../shared/chains');
const { getAddrNextIndex, deriveAddrByIndex } = require('../../utils/address');
const { getBlockHeight } = require('../../utils/block-height');
const { isAddressValid } = require('../../utils/address');
const { registerAddress } = require('../../utils/blocknative');
const { rateLimiter } = require('../../utils/rate-limiter');
const addressesModel = require('../../models/addresses');
const bitcoinjs = require('bitcoinjs-lib');
const express = require('express');
const ordersModel = require('../../models/orders');

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const BTC_NETWORK = process.env.BTC_NETWORK;
const FAST_SWAP_ADDRESS = process.env.FAST_SWAP_ADDRESS;
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);

const MAX_VALUE = process.env.APP_TRANSFER_MAX;
const MIN_VALUE = process.env.APP_TRANSFER_MIN;

const router = express.Router();

require('dotenv').config();

router.post('/', rateLimiter, async (req, res) => {
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

  if (_.isEqual(flow, RBTC_TO_BTC)) {
    const network = _.isEqual(BTC_NETWORK, 'testnet') ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;

    if (!isAddressValid(btc.address, network)) {
      return res.status(400).json({
        error: {
          form: {
            address: 'Recipient address must be a valid BTC address.'
          }
        }
      });
    }
  }

  /**
   * Chequeo backend side que los valores esten dentro de los parámetros para evitar ataques con BURP client side.
   */
  if (Number(value) < MIN_VALUE || Number(value) > MAX_VALUE) {
    return res.status(400).json({
      error: 'Value error; check min/max caps.'
    });
  }

  let netValue = Number(value) - (Number(value) * process.env.OPERATION_FEE_PERCENT);
  
  try {
    const order = new ordersModel({
      rsk,
      flow,
      value,
      netValue: netValue,
      operationFee: process.env.OPERATION_FEE_PERCENT
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
