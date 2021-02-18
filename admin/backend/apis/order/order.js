const express = require('express');
const ordersModel = require('../../models/orders');
const { UNCONFIRMED } = require('../../../../shared/status');
const { RBTC_TO_BTC } = require('../../../../shared/flows');
const _ = require('lodash');

require('dotenv').config();

const router = express.Router();

router.put('/', async (req, res) => {
  try {

    let { id, txId } = req.body;

    if (!id || !txId)
      return res.status(200).json({
        error: 'Missing Parameters'
      });

    let filter = {
      _id: id,
      flow: RBTC_TO_BTC
    };

    const order = await ordersModel.findOne(filter);

    if (_.isEmpty(order)) 
    return res.status(404).json({
      error: "Order not found"
    });

    order.btc.status = UNCONFIRMED;
    order.btc.txId = txId;

    let savedOrder = await order.save();

    return res.status(200).json({
      order: savedOrder
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching orders'
    });
  }
});

module.exports = router;
