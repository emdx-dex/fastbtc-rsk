const _ = require('lodash');
const express = require('express');
const orderModel = require('../../models/orders');
const STATUS = require('../../utils/status');

const router = express.Router();

require('dotenv').config();

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
    const order = await orderModel.findById(id);

    return res.json({
      data: { order }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
