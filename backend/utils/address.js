const addressesModel = require('../models/addresses');
const bip32 = require('bip32');
const bitcoinjs = require('bitcoinjs-lib');
const ElectrumClient = require('@codewarriorr/electrum-client-js');
const Web3 = require('web3');
const { BTC } = require('../../shared/chains');

let web3;

require('dotenv').config();

var ss = process.env.BTC_ELECTRUM_SERVERS.split(",");
var server = ss[Math.floor(Math.random() * Math.floor(ss.length))].split("|");

const BTC_ELECTRUM_URI = server[0];
const BTC_ELECTRUM_PORT = server[1];
const BTC_ELECTRUM_PROTOCOL = server[2];

const M_OF_N = Number(process.env.BTC_MULTISIG_M);
const NETWORK = (process.env.BLOCKCHAIN_ENV === 'testnet') ? bitcoinjs.networks.testnet : bitcoinjs.networks.bitcoin;
const XPUB1 = process.env.BTC_MULTISIG_XPUB1;
const XPUB2 = process.env.BTC_MULTISIG_XPUB2;
const XPUB3 = process.env.BTC_MULTISIG_XPUB3;
const XPUB4 = process.env.BTC_MULTISIG_XPUB4;

/*
  Based on BIP-67 pubkeys must be lexographically sorted to create the multisig redeem script
  See: https://github.com/bitcoin/bips/blob/master/bip-0067.mediawiki
*/
function sortBuffers(bufArr) {
  return bufArr.sort(Buffer.compare);
}

async function connect() {
  try {

    let client = new ElectrumClient(
      BTC_ELECTRUM_URI,
      BTC_ELECTRUM_PORT,
      BTC_ELECTRUM_PROTOCOL
    );

    await client.connect();

    return client;
  } catch (error) {
    console.log("SERVER: " + BTC_ELECTRUM_PROTOCOL + " " + BTC_ELECTRUM_URI + " " + BTC_ELECTRUM_PORT);
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
  TODO:// Extender el batch derive para detectar network.
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
  TODO: Esto se puede mejorar haciendo que reciba un array dinámico de XPUBS, queda como mejora, siendo que se configuran una vez y quedan, no habría problema.
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

  if (process.env.BLOCKCHAIN_ENV != 'testnet') {

    arr[2] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB3, NETWORK)
        .derive(0)
        .derive(_index)
        .publicKey,
    }, NETWORK).pubkey;

    arr[3] = bitcoinjs.payments.p2pkh({
      pubkey: bip32.fromBase58(XPUB4, NETWORK)
        .derive(0)
        .derive(_index)
        .publicKey,
    }, NETWORK).pubkey;

  }

  let addr = bitcoinjs.payments.p2sh({
    redeem: bitcoinjs.payments.p2ms({
      m: M_OF_N, pubkeys: sortBuffers(arr), network: NETWORK
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

    let client = await connect();
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


/**
 * Returns Address balance in ETH.
 * @param {RSK/ETH address} _addr String
 */
async function getRSKAddressBalance(_addr) {

  try {
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
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

