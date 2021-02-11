const _ = require('lodash');
const { FAILED, PENDING, UNCONFIRMED } = require('../../shared/status');
const abi = require('../../contracts/abi/FastSwap.abi.json');
const ordersModel = require('../models/orders');
const Web3 = require('web3');

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
  const web3 = getInstance();
  const contract = new web3.eth.Contract(abi, fastSwapAddress);

  return contract;
}

async function getBlockNumber() {
  try {
    const web3 = getInstance();
    const blockNumber = await web3.eth.getBlockNumber();

    return blockNumber;
  } catch (error) {
    return 0;
  }
}

async function swapIn(destiny, _amount) {
  return new Promise(async (resolve, reject) => {
    const contract = getContract();
    const web3 = getInstance();
    const amount = web3.utils.toWei(_amount);

    try {
      const method = contract.methods.rbtcSwapIn(destiny, amount);
      const gas = await method.estimateGas({
        from: operatorAddress,
        value: web3.utils.toHex(amount)
      });
      console.log('gas ---> ', gas);
      const gasPrice = await web3.eth.getGasPrice();
      const nonce = await web3.eth.getTransactionCount(operatorAddress);
      const rawTx = {
        data: method.encodeABI(),
        from: operatorAddress,
        // TODO: Chequear tema gas
        gas: web3.utils.toHex(100000), // web3.utils.toHex(gas),
        gasPrice: web3.utils.toHex(gasPrice),
        nonce: web3.utils.toHex(nonce),
        to: fastSwapAddress
      };
      const { rawTransaction } = await web3.eth.accounts.signTransaction(rawTx, operatorPrivateKey);

      return web3.eth.sendSignedTransaction(rawTransaction)
        .on('transactionHash', (hash) => {
          console.log(`Transaction hash: ${hash}`)
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          resolve({ confirmationNumber, receipt });
        })
        .on('error', (error) => {
          reject(error);
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
    const { source: senderAddress, amount: value } = _.get(event, 'returnValues', {});
    const amount = web3.utils.fromWei(value);

    try {
      const order = await ordersModel.findOne({
        'rsk.senderAddress': senderAddress,
        'rsk.status': PENDING
      });

      if (_.isEmpty(order)) return;

      // TODO: Check this with tx fees.
      if (amount < order.value) {
        order.rsk.status = FAILED;
      } else {
        order.rsk.block = blockNumber;
        order.rsk.status = UNCONFIRMED;
      }

      await order.save();
    } catch (error) {
      console.log(`[ERROR] On listen RBTCSwapOut. ${error}`);
    }
  });
}

module.exports = {
  getBlockNumber,
  listenRBTCSwapOut,
  swapIn
};
