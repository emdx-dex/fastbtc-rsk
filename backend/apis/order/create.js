const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const web3 = require('web3');


const BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

require('dotenv').config();


const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');


TODO:// FALTABA EL SORT LEXICOGRAFICO DIOS 
//https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
/*

2 of 2
Cosigners: 
	- AB01: xpub6B7tTKXGVjdH99zkrPzdA8ybm9cL2b3c9oRB7RCQn38oRrGQkgMWEoCBbfL3SK5vreU8bg4XvTWW2YefRdLNxQzstZ9JM4Rdc63xd2yec2y
	- AB02:
xpub6B1TUQ6VCqaNBdUA8u4ezd9SK2cYD2PZsqcJjYppgiwXBrGdrRTijvSU1DRfXPr5Lxo5EVKc6cDNt3Dok5PaWyuojyH9dWwEPwpvUMdBPxg

Multisig
Addresses:
	1. 3ExgJ4Pr18HqHnXSQiSXUFQk2eswAPSkQr
	2. 3DcwgVRxuKvdVGGovsGQJjhPkB9397pLom
	3. 36vDPM4EuQseSDXDu3yyKFBBLKSQkZDGaq
	4. 33jjgX4jeypVhGFnLvufa4GfDMy8UkKGkt
	5. 3MBU9y8TG8CGzMMFTa9udpUQrQNhtgn2YL
*/


const xpub1 = 'xpub6B7tTKXGVjdH99zkrPzdA8ybm9cL2b3c9oRB7RCQn38oRrGQkgMWEoCBbfL3SK5vreU8bg4XvTWW2YefRdLNxQzstZ9JM4Rdc63xd2yec2y';

const xpub2 = "xpub6B1TUQ6VCqaNBdUA8u4ezd9SK2cYD2PZsqcJjYppgiwXBrGdrRTijvSU1DRfXPr5Lxo5EVKc6cDNt3Dok5PaWyuojyH9dWwEPwpvUMdBPxg";

const asd1 = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(xpub1).derive(0).derive(4).publicKey,
});
//030d21a021c1e5665c09e42fbb67e47ee670d0e09d8c31fed4107c8e6ea5a5c7ae

const asd2 = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(xpub2).derive(0).derive(4).publicKey,
});
//02503678151ddb043762914252d2773f7135051e85d2b3d2837353d4030a0707bb

console.log("xpub1 pkey:", asd1.pubkey.toString('hex'));
console.log("xpub1 addr:", asd1.address);

console.log("\nxpub1 pkey:", asd2.pubkey.toString('hex'));
console.log("xpub1 addr:", asd2.address);
console.log("\n");

/* 
1. 3ExgJ4Pr18HqHnXSQiSXUFQk2eswAPSkQr
2. 3DcwgVRxuKvdVGGovsGQJjhPkB9397pLom
3. 36vDPM4EuQseSDXDu3yyKFBBLKSQkZDGaq
4. 33jjgX4jeypVhGFnLvufa4GfDMy8UkKGkt
5. 3MBU9y8TG8CGzMMFTa9udpUQrQNhtgn2YL

*/

const pubkeys = [
  asd1.pubkey,
  asd2.pubkey,
].map(hex => Buffer.from(hex, 'hex'));


function sortBuffers(bufArr) {
  return bufArr.sort(Buffer.compare);
}

const {address} = bitcoinjs.payments.p2sh({
  redeem: bitcoinjs.payments.p2ms({ m: 2, pubkeys: sortBuffers(pubkeys) }),
});

console.log("MS", address);
console.log("\n");


// console.log(`the addressString is ${address}`);
// console.log("pub:", bip32.fromBase58(xpub).derive(0).derive(0).publicKey.toString('hex'));


//let node = bip32.fromBase58('xprv9s21ZrQH143K3QTDL4LXw2F7HEK3wJUD2nW2nRk4stbPy6cq3jPPqjiChkVvvNKmPGJxWUtg6LnF5kejMRNNU3TGtRBeJgk33yuGBxrMPHi');

// function getNetwork(testnet) {
//   return testnet
//     ? { network: bitcoinjs.networks.testnet, coinType: 1 }
//     : { network: bitcoinjs.networks.bitcoin, coinType: 0 };
// }

// //const { network, coinType } = getNetwork(true);

// function setHDPath(accountIndex = 0, addressIndex = 0, coinType = 0) {
//   return `m/44'/${coinType}'/${accountIndex}'/0/${addressIndex}`;
// }

//let master = 'vpub5W15r35vZQyZLNrrX9ZwYde5qZQ6CkDB6hGdeHZJu9gZmhrhV7eL2d8UB9ZLz63wWDFdSvpYnJ6DjyBRu7Eziq8po3UwfJENu8tyfYeQxSk';

//let master = 'tpubD6NzVbkrYhZ4WxaHC3WbrvQdderSFUSJuPe3Z8fqQzNvTxXuhAxT5EDmNKzSDm5gsuoG1jfkhR8JxYDGvmv1niGdS6qBpwEtqo8UzCJmCd2'

//let master = 'xprv9s21ZrQH143K2gbs8UH9wqJSLcakYuS7n2PcyaUdw2zehzERYkV7QfxPtt3A1KMpaSw7jbAC9hnrNuBJxxD2ZwdQYKbhBs75kC3sWD2FjAQ';

// var hdkey = HDKey.fromExtendedKey(master)

// console.log(hdkey.derive("m/0/0/0"));

// let master = "xpub6EGGAe4M1j1jMUE8At2z8A3qHLoiuhSpzZuEBBLincsEEaiN7YmyWhDx22Rr2zXUTJ1E8x5KVcjZiYDvLQurUcnQX7yb6byvJzRM2z7iuHW";
// let node = bip32.fromBase58(master);

//let HDPath = setHDPath();

// let child = node.derivePath("m/44'/0'/0'/0");
// console.log(child);



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
