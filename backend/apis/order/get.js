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
    let order = await orderModel.findById(id);
    const { id: height } = await getLastBlock();
    const blockDelta = order.btc.block ? height - order.btc.block : 0;
    const status = (blockDelta >= BLOCK_HEIGHT_CONFIRMATION) ? CONFIRMED : order.btc.status;
    // This ternary is because sometimes last block is behind the hook.
    const confirmations = (blockDelta >= 0) ? blockDelta : 0;

    if (order.btc.status !== CONFIRMED && status === CONFIRMED) {
      order.btc.status = CONFIRMED;

      order = await order.save();
    }

    return res.json({
      data: {
        order: {
          ...order.toJSON(),
          btc: {
            ...order.btc,
            confirmations,
            requiredConfirmations: BLOCK_HEIGHT_CONFIRMATION
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
