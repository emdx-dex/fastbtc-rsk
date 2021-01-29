const _ = require('lodash');
const express = require('express');
const orderModel = require('../../models/orders');

const router = express.Router();

require('dotenv').config();

router.post('/', async (req, res) => {
  const {
    blockHeight,
    netBalanceChanges,
    status,
    txid,
    watchedAddress
  } = req.body;

  if (status !== 'confirmed') {
    console.log('TX received but not confirmed');

    return {
      data: null,
      error: null,
      message: 'Recv unconfirmed tx, ignoring..'
    };
  }

  console.log('TX confirmed');

  try {

    const { delta } = netBalanceChanges.find(({ address }) => {
      return address.toLowerCase() === watchedAddress;
    });

    const order = new orderModel({
      block: blockHeight,
      // TODO: Get deposit address.
      // btcDepositAddress: ,
      rbtcTransferAddress: watchedAddress,
      txId: txid,
      value: delta
    });

    await order.save();

    return res.sendStatus(200);
  } catch (error) {
    return res.sendStatus(500);
  }
});

module.exports = router;
