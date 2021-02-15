const addressesModel = require('../models/addresses');
const bip32 = require('bip32');
const bitcoinjs = require('bitcoinjs-lib');

require('dotenv').config();

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

const M_OF_N = process.env.BTC_MULTISIG_M;
const NETWORK = (process.env.BLOCKCHAIN_ENV === 'testnet') ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;
const XPUB1 = process.env.BTC_MULTISIG_XPUB1;
const XPUB2 = process.env.BTC_MULTISIG_XPUB2;

/* 
  Based on BIP-67 pubkeys must be lexographically sorted to create the multisig redeem script
  See: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
*/
function sortBuffers(bufArr) {
  return bufArr.sort(Buffer.compare);
}

/* 
  Function to batch derive N amount of multisig addresses based on ENV XPUBs
*/
function deriveAddresess(_GAP_LIMIT) {

  let pubkeyArray = [];

  for (let i = 0; i < _GAP_LIMIT; i++) {

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
        redeem: bitcoinjs.payments.p2ms({
          m: M_OF_N, pubkeys: pubArr
        }),
      }).address
    )

  });

  return addresses
};

/*
  Get the next addr derivation path by checking the length of total addresses document found on MongoDB
*/
async function getAddrNextIndex() {
  let addresses = await addressesModel.find();
  return addresses.length == 0 ? 0 : addresses.length + 1;
}

/* 
  Return the next addr for the user to deposit based on the total addressess already used.
*/
function deriveAddrByIndex(_index) {

  let arr = [];

  arr[0] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB1, NETWORK)
      .derive(0)
      .derive(_index)
      .publicKey,
  }, NETWORK).pubkey;

  arr[1] = bitcoinjs.payments.p2pkh({
    pubkey: bip32.fromBase58(XPUB2, NETWORK)
      .derive(0)
      .derive(_index)
      .publicKey,
  }, NETWORK).pubkey;

  let addr = bitcoinjs.payments.p2sh({
    redeem: bitcoinjs.payments.p2ms({
      m: 2, pubkeys: sortBuffers(arr), network: NETWORK
    }),
  }, NETWORK).address
  return addr;
}

module.exports = {
  sortBuffers: sortBuffers,
  deriveAddresess: deriveAddresess,
  getAddrNextIndex: getAddrNextIndex,
  deriveAddrByIndex: deriveAddrByIndex
};

