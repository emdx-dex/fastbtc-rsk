const _ = require('lodash');
const { RBTC_TO_BTC, BTC_TO_RBTC } = require('../../../../shared/flows');
const { UNCONFIRMED } = require('../../../../shared/status');
const express = require('express');
const ordersModel = require('../../models/orders');

require('dotenv').config();

const router = express.Router();

router.put('/', async (req, res) => {
  try {
    let { id, txId, flow } = req.body;

    console.log(id, txId, flow);

    if (!id || !txId || !flow) {
      return res.status(400).json({
        error: 'Missing Parameters.'
      });
    }

    let filter = {
      _id: id,
      flow: floworder.rsk.status = UNCONFIRMED;
      order.rsk.txId = txId
    };

    const order = await ordersModel.findOne(filter);

    if (_.isEmpty(order)) {
      return res.status(404).json({
        error: 'Order not found.'
      });
    }

    if (flow == RBTC_TO_BTC) {
      order.btc.status = UNCONFIRMED;
      order.btc.txId = txId;
    }

    if(flow == BTC_TO_RBTC){
      order.rsk.status = UNCONFIRMED;
      order.rsk.txId = txId;
    }

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
