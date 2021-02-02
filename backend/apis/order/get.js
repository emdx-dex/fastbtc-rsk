const { getLastBlock } = require('../../utils/block');
const express = require('express');
const orderModel = require('../../models/orders');
const { CONFIRMED } = require('../../../shared/status');

require('dotenv').config();

const BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { id: height } = await getLastBlock();
    const order = (await orderModel.findById(id)).toJSON();
    const blockDelta = order.btc.block ? height - order.btc.block : 0;
    const status = (blockDelta >= BLOCK_HEIGHT_CONFIRMATION) ? CONFIRMED : order.btc.status;


    return res.json({
      data: {
        order: {
          ...order,
          btc: {
            ...order.btc,
            confirmations: blockDelta,
            requiredConfirmations: BLOCK_HEIGHT_CONFIRMATION,
            status
          }
        }
      }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching order'
    });
  }
});

module.exports = router;
