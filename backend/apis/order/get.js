const _ = require('lodash');
const { BTC, RSK } = require('../../../shared/chains');
const { getBlockNumber } = require('../../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../../rsk/index');
const express = require('express');
const ordersModel = require('../../models/orders');
const { rateLimiter } = require('../../utils/rate-limiter');

require('dotenv').config();

const BTC_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BTC_BLOCK_HEIGHT_CONFIRMATION);
const RSK_BLOCK_HEIGHT_CONFIRMATION = Number(process.env.RSK_BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

router.get('/:id', rateLimiter, async (req, res) => {
  const { id } = req.params;

  try {
    /**
     * Busco la orden por id pero que no esté marcada como deleted.
     */
    const order = await ordersModel.findOne({
      _id: id,
      deleted: false
    });

    if (_.isEmpty(order)) { 
      return res
        .status(404)
        .json({
          error: 'The order has been expired or not exist'
        }); 
    }

    /**
     * Esto se reemplaza por socket en el futuro, pero por ahora con el estado que viene de orden va a alcanzar.
     */
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
