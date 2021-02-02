const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const web3 = require('web3');
const bitcoinjs = ('bitcoinlib-js');
const HDKey = require('hdkey')

let bip32 = require('bip32')

const BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

require('dotenv').config();

//let node = bip32.fromBase58('xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi');

function getNetwork(testnet) {
  return testnet
    ? { network: bitcoinjs.networks.testnet, coinType: 1 }
    : { network: bitcoinjs.networks.bitcoin, coinType: 0 };
}

//const { network, coinType } = getNetwork(true);

function setHDPath(accountIndex = 0, addressIndex = 0, coinType = 0) {
  return `m/44'/${coinType}'/${accountIndex}'/0/${addressIndex}`;
}

//let master = 'vpub5W15r35vZQyZLNrrX9ZwYde5qZQ6CkDB6hGdeHZJu9gZmhrhV7eL2d8UB9ZLz63wWDFdSvpYnJ6DjyBRu7Eziq8po3UwfJENu8tyfYeQxSk';

//let master = 'tpubD6NzVbkrYhZ4WxaHC3WbrvQdderSFUSJuPe3Z8fqQzNvTxXuhAxT5EDmNKzSDm5gsuoG1jfkhR8JxYDGvmv1niGdS6qBpwEtqo8UzCJmCd2'

//let master = 'xprv9s21ZrQH143K2gbs8UH9wqJSLcakYuS7n2PcyaUdw2zehzERYkV7QfxPtt3A1KMpaSw7jbAC9hnrNuBJxxD2ZwdQYKbhBs75kC3sWD2FjAQ';

// var hdkey = HDKey.fromExtendedKey(master)

// console.log(hdkey.derive("m/0/0/0"));

let master = "xpub6EGGAe4M1j1jMUE8At2z8A3qHLoiuhSpzZuEBBLincsEEaiN7YmyWhDx22Rr2zXUTJ1E8x5KVcjZiYDvLQurUcnQX7yb6byvJzRM2z7iuHW";
let node = bip32.fromBase58(master);

//let HDPath = setHDPath();

let child = node.derivePath("m/44'/0'/0'/0");
console.log(child);

router.post('/', async (req, res) => {
  const { btc, flow, rsk, value } = req.body;
  const depositAddress = process.env.BTC_DEPOSIT_ADDRESS;

  if (_.isEmpty(flow)) {
    return res.status(400).json({
      error: 'flow is a required parameter.'
    });
  }

  if (![BTC_TO_RBTC, RBTC_TO_BTC].includes(flow)) {
    return res.status(400).json({
      error: 'Choose a valid conversion flow.'
    });
  }

  // TODO: Add validations

  // if (_.isEmpty(rbtcAddress)) {
  //   return res.status(400).json({
  //     error: 'RBTC address is a required parameter.'
  //   });
  // }

  // if (!web3.utils.isAddress(rbtcAddress)) {
  //   return res.status(400).json({
  //     error: 'RBTC address should be a valid RSK address.'
  //   });
  // }

  if (_.isNaN(Number(value)) || value <= 0) {
    return res.status(400).json({
      error: 'value is a required parameter.'
    });
  }

  try {
    const order = new orderModel({
      rsk,
      flow,
      value
    });

    if (flow === BTC_TO_RBTC) {
      await registerAddress(depositAddress);

      order.btc = {
        ...order.btc,
        address: depositAddress,
        confirmations: 0,
        requiredConfirmations: BLOCK_HEIGHT_CONFIRMATION
      };
    }

    if (flow === RBTC_TO_BTC) {
      await registerAddress(depositAddress);

      order.btc = {
        ...order.btc,
        ...btc
      };
    }

    await order.save();

    return res.json({
      data: { order }
    });
  } catch (error) {
    return res.status(500).json({ error });
  }
});

module.exports = router;
