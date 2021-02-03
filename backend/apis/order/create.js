const _ = require('lodash');
const { BTC_TO_RBTC, RBTC_TO_BTC } = require('../../../shared/flows');
const { registerAddress } = require('../../utils/blocknative');
const express = require('express');
const orderModel = require('../../models/orders');
const addressesModel = require('../../models/addresses');

const web3 = require('web3');

const bitcoinjs = require('bitcoinjs-lib');
const bip32 = require('bip32');


const BLOCK_HEIGHT_CONFIRMATION = Number(process.env.BLOCK_HEIGHT_CONFIRMATION);
const router = express.Router();

require('dotenv').config();

function sortBuffers(bufArr) {
  return bufArr.sort(Buffer.compare);
}


//TODO: FALTABA EL SORT LEXICOGRAFICO DIOS 
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

//TODO: set xpubs from ENV
const XPUB1 = 'xpub6B7tTKXGVjdH99zkrPzdA8ybm9cL2b3c9oRB7RCQn38oRrGQkgMWEoCBbfL3SK5vreU8bg4XvTWW2YefRdLNxQzstZ9JM4Rdc63xd2yec2y';
const XPUB2 = "xpub6B1TUQ6VCqaNBdUA8u4ezd9SK2cYD2PZsqcJjYppgiwXBrGdrRTijvSU1DRfXPr5Lxo5EVKc6cDNt3Dok5PaWyuojyH9dWwEPwpvUMdBPxg";

function deriveAddresess(){
  let pubkeyArray = [];

  const M_OF_N = 2;
  const GAP_LIMIT = 20;


  for (let i = 0; i < GAP_LIMIT; i++) {
    
    let arr = [];

    arr[0] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB1).derive(0).derive(i).publicKey,
    }).pubkey;

    arr[1] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB2).derive(0).derive(i).publicKey,
    }).pubkey;

    pubkeyArray.push(sortBuffers(arr));
    
  }

  let addresses = [];

  pubkeyArray.forEach(pubArr => {

    addresses.push(
      bitcoinjs.payments.p2sh({
        redeem: bitcoinjs.payments.p2ms({ m: M_OF_N, pubkeys: pubArr }),
      }).address
    )

  });

  return addresses
};


async function getAddrNextIndex(){
  
  let addresses = await addressesModel.find({used:true});
  
  return addresses.length == 0 ? 0 : addresses.length+1;
}

function deriveAddrByIndex(_index){

  let arr = [];

  arr[0] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB1).derive(0).derive(_index).publicKey,
  }).pubkey;

  arr[1] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB2).derive(0).derive(_index).publicKey,
  }).pubkey;


  let addr = bitcoinjs.payments.p2sh({
    redeem: bitcoinjs.payments.p2ms({ m: 2, pubkeys: sortBuffers(arr) }),
  }).address
  return addr;

}


(async function(){
  let idx = await getAddrNextIndex();
  console.log(idx)
  console.log(deriveAddrByIndex(idx));
})()


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
