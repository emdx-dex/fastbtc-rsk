const _ = require('lodash');
const { BTC, RSK } = require('../../../shared/chains');
const { CONFIRMED } = require('../../../shared/status');
const { getBlockNumber } = require('../../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../../rsk/index');
const express = require('express');
const ordersModel = require('../../models/orders');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION);
const RBTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.RBTC_BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

async function getConfirmations(order, chain) {
  if (_.isEmpty(chain)) return {};

  const heightConfirmation = chain === BTC ? BTC_BLOCK_HEIGHT_CONFIRMATION : RBTC_BLOCK_HEIGHT_CONFIRMATION;
  const getHeight = chain === BTC ? getBlockNumber : getRSKBlockNumber;
  const height = await getHeight();
  const blockDelta = order[chain].block ? height - order[chain].block : 0;
  const status = (blockDelta >= heightConfirmation) ? CONFIRMED : order[chain].status;
  const confirmations = (blockDelta >= 0) ? blockDelta : 0;

  if (order[chain].status !== CONFIRMED && status === CONFIRMED) {
    order[chain].status = CONFIRMED;

    order = await order.save();
  }

  return {
    ...order[chain],
    confirmations,
    requiredConfirmations: heightConfirmation
  }
}

router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const order = await ordersModel.findById(id);
    const btc = await getConfirmations(order, BTC);
    const rsk = await getConfirmations(order, RSK);

    return res.json({
      data: {
        order: {
          ...order.toJSON(),
          btc,
          rsk
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
