const addressesModel = require('../models/addresses');
const bip32 = require('bip32');
const bitcoinjs = require('bitcoinjs-lib');
const ElectrumClient = require('@codewarriorr/electrum-client-js');
const Web3 = require('web3');
const { BTC } = require('../../shared/chains');

let web3;


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

async function connect() {
  try {

    const client = new ElectrumClient(
      "tn.not.fyi",
      55002,
      "ssl"
    );

    await client.connect();

    console.log('------------------------------------------------');

    return client;
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
 * Validates any address, including legacy, p2sh and bech32
 * @param address
 * @returns {boolean}
 */
function isAddressValid(address, _network) {
  try {
    bitcoinjs.address.toOutputScript(address, _network);
    return true;
  } catch (e) {
    return false;
  }
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

/**
 * Returns address balance in BTC
 * @param {base58 Bitcoin address} _address string
 * @param {testnet|mainnet} _network string
 */
async function getBTCAddressBalance(_address, _network = 'testnet') {

  const BTC_UNIT = 100000000;
  let network;

  _network == 'testnet' ? network = bitcoinjs.networks.testnet : network = bitcoinjs.network.bitcoin;

  if (!isAddressValid(_address, network))
    return "Invalid Address";

  try {

    let client = await connect();//TODO: check network/testnet before this

    const script = bitcoinjs.address.toOutputScript(_address, network);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    let balance = await client.blockchain_scripthash_getBalance(rScriptHash);

    await client.close();

    return balance.confirmed / BTC_UNIT;

  } catch (error) {
    console.log(error);
    return error;
  }

}

function getInstance() {
  if (web3) return web3;

  const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS);

  web3 = new Web3(web3Provider);

  return web3;
}

/**
 * Returns Address balance in ETH.
 * @param {RSK/ETH address} _addr String
 */
async function getRSKAddressBalance(_addr) {

  try {
    const web3 = getInstance();

    let balance = await web3.eth.getBalance(_addr);

    return web3.utils.fromWei(balance);
  } catch (error) {
    console.log(error);
    return -1;
  }

}

module.exports = {
  deriveAddrByIndex,
  deriveAddresess,
  getBTCAddressBalance,
  getRSKAddressBalance,
  getAddrNextIndex,
  isAddressValid,
  sortBuffers
};

