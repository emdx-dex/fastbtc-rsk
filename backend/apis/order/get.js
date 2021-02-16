const _ = require('lodash');
const { BTC, RSK } = require('../../../shared/chains');
const { getBlockHeight } = require('../../utils/block-height');
const { getBlockNumber } = require('../../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../../rsk/index');
const express = require('express');
const ordersModel = require('../../models/orders');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(BTC);
const RSK_BLOCK_HEIGHT_CONFIRMATION = getBlockHeight(RSK);
const router = express.Router();

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await ordersModel.findById(id);

    if (_.isEmpty(order)) return res.sendStatus(404);

    const btcBlockNumber = await getBlockNumber();
    const rskBlockNumber = await getRSKBlockNumber();

    return res.json({
      data: {
        order: {
          ...order.toJSON(),
          btc: {
            ...order.btc,
            confirmations: (order.btc.block) ? btcBlockNumber - order.btc.block : 0,
            requiredConfirmations: BTC_BLOCK_HEIGHT_CONFIRMATION
          },
          rsk: {
            ...order.rsk,
            confirmations: (order.rsk.block) ? rskBlockNumber - order.rsk.block : 0,
            requiredConfirmations: RSK_BLOCK_HEIGHT_CONFIRMATION
          }
        }
      }
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      error: 'Error fetching order'
    });
  }
});

module.exports = router;
