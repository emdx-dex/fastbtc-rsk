const _ = require('lodash');
const { RBTC_TO_BTC } = require('../../../../shared/flows');
const { UNCONFIRMED } = require('../../../../shared/status');
const { validateTxId } = require('../../utils/transaction');
const express = require('express');
const ordersModel = require('../../models/orders');

require('dotenv').config();

const router = express.Router();

router.put('/', async (req, res) => {
  try {
    let { id, txId } = req.body;

    if (!id || !txId) {
      return res.status(400).json({
        error: 'Missing Parameters.'
      });
    }

    const isValid = await validateTxId(txId);

    if (!isValid) {
      return res.status(400).json({
        error: 'Tx id is not valid.'
      });
    }

    let filter = {
      _id: id,
      flow: RBTC_TO_BTC
    };

    const order = await ordersModel.findOne(filter);

    if (_.isEmpty(order)) {
      return res.status(404).json({
        error: 'Order not found.'
      });
    }

    order.btc.status = UNCONFIRMED;
    order.btc.txId = txId;

    let savedOrder = await order.save();

    return res.status(200).json({
      data: {
        order: savedOrder
      }
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching orders'
    });
  }
});

module.exports = router;
