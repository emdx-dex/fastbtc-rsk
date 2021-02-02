const express = require('express');
const orderModel = require('../../models/orders');

require('dotenv').config();

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

module.exports = router;
