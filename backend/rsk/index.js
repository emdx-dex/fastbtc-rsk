const _ = require('lodash');
const { FAILED, PENDING, UNCONFIRMED } = require('../../shared/status');
const abi = require('../../contracts/abi/FastSwap.abi.json');
const ordersModel = require('../models/orders');
const Web3 = require('web3');
const { sendTelegramAlert } = require('../utils/alerts');

require('dotenv').config();

let web3;

const fastSwapAddress = process.env.FAST_SWAP_ADDRESS.toLowerCase();
const operatorAddress = process.env.FAST_SWAP_OPERATOR_ADDRESS;
const operatorPrivateKey = process.env.FAST_SWAP_OPERATOR_PRIV_KEY;

function getInstance() {
  if (web3) return web3;

  const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS);

  web3 = new Web3(web3Provider);

  return web3;
}

function getContract() {
  const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
  const web3 = new Web3(web3Provider);
  const contract = new web3.eth.Contract(abi, fastSwapAddress);

  return contract;
}

async function getBlockNumber() {
  try {
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    const blockNumber = await web3.eth.getBlockNumber();

    return blockNumber;
  } catch (error) {
    return -1;
  }
}

async function getTransactionReceipt(txId) {
  try {
    const web3 = getInstance();
    const receipt = await web3.eth.getTransactionReceipt(txId);

    return receipt;
  } catch (error) {
    return {};
  }
}

/**
 * Flow: BTC_TO_RBTC: cuando el usuario final recibe RBTC, previo depósito BTC.
 * @param {eth address} destiny string  
 * @param {_amount netValue to transfer} string
 * @param {mongoID} _orderId string
 */
async function swapIn(destiny, _amount, _orderId) {
  return new Promise(async (resolve, reject) => {
    try {
      const contract = getContract();
      const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
      const web3 = new Web3(web3Provider);
      const amount = web3.utils.toWei(_amount);
      const method = contract.methods.rbtcSwapIn(destiny, amount);
      const gas = await method.estimateGas({ from: operatorAddress });
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(operatorAddress, 'pending');
      const safeMarginGas = _.toInteger(gas * 0.1);
      const rawTx = {
        data: method.encodeABI(),
        from: operatorAddress,
        gas: web3.utils.toHex(gas + safeMarginGas),
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
        to: fastSwapAddress
      };
      const { rawTransaction } = await web3.eth.accounts.signTransaction(rawTx, operatorPrivateKey);

      web3.eth.sendSignedTransaction(rawTransaction, (error, hash) => {
        if (error) {
          console.log('Swapin error ', error);
          const msgToAlert = `Failed to execute rsk sawpIn() tx.\n OrderId: ${_orderId}\n To: ${destiny}\n Value: ${_amount}\n RawTx: ${rawTransaction}`;

          sendTelegramAlert(msgToAlert);
          
          return reject(error);
        }

        console.log(`Transaction hash: ${hash}`)

        resolve(hash);
      });
    } catch (error) {
      console.log(`[ERROR] On Create signed transaction. ${error}`);

      reject(error);
    }
  });
}

function listenRBTCSwapOut() {
  const contract = getContract();

  contract.events.RBTCSwapOut().on('data', async function (event) {
    const blockNumber = _.get(event, 'blockNumber');
    const transactionHash = _.get(event, 'transactionHash');
    const { source: senderAddress, amount: value } = _.get(event, 'returnValues', {});
    const amount = web3.utils.fromWei(value);

    console.log(`[RBTCSwapOut] Tx received: ${transactionHash}`);

    try {
      const order = await ordersModel.findOne({
        'rsk.senderAddress': senderAddress,
        'rsk.status': PENDING,
        deleted: false
      });

      if (_.isEmpty(order)) return;

      console.log(`[RBTCSwapOut] Order found: ${order._id}`);

      // TODO: Check this with tx fees.
      if (amount < order.value) {
        console.log(`[RBTCSwapOut] Order ${order._id}: sent less value than needed.`);

        order.rsk.status = FAILED;
      } else {
        console.log(`[RBTCSwapOut] Order ${order._id}: user sent correct amount.`);

        order.rsk.block = blockNumber;
        order.rsk.status = UNCONFIRMED;
        order.rsk.txId = transactionHash;
      }

      await order.save();
    } catch (error) {
      console.log(`[ERROR] On listen RBTCSwapOut. ${error}`);
    }
  });
}

module.exports = {
  getBlockNumber,
  getTransactionReceipt,
  listenRBTCSwapOut,
  swapIn
};
