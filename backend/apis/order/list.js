const { getLastBlock } = require('../../utils/block');
const express = require('express');
const orderModel = require('../../models/orders');
const STATUS = require('../../../common/status');

require('dotenv').config();

const BLOCK_HEIGHT_CONFIRMATION = process.env.BLOCK_HEIGHT_CONFIRMATION;
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const orders = await orderModel.find();

    return res.json({
      data: { orders }
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Error fetching orders'
    });
  }
});

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const { id: height } = await getLastBlock();
    const order = (await orderModel.findById(id)).toJSON();
    const blockDelta = height - order.btc.block;
    const status = (blockDelta >= BLOCK_HEIGHT_CONFIRMATION) ? STATUS.CONFIRMED : order.btc.status;


    return res.json({
      data: {
        ...order,
        btc: {
          ...order.btc,
          confirmations: blockDelta,
          requiredConfirmations: BLOCK_HEIGHT_CONFIRMATION,
          status
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error });
  }
});

module.exports = router;
