const _ = require('lodash');
const { FAILED, PENDING, UNCONFIRMED } = require('../../shared/status');
const { RBTC_TO_BTC } = require('../../shared/flows');
const abi = require('../../contracts/abi/FastSwap.abi.json');
const ordersModel = require('../models/orders');
const Web3 = require('web3');
const { sendTelegramAlert } = require('../utils/alerts');

require('dotenv').config();

const fastSwapAddress = process.env.FAST_SWAP_ADDRESS.toLowerCase();
const operatorAddress = process.env.FAST_SWAP_OPERATOR_ADDRESS;
const operatorPrivateKey = process.env.FAST_SWAP_OPERATOR_PRIV_KEY;

function getContract(web3) {
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
    const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
    const web3 = new Web3(web3Provider);
    const receipt = await web3.eth.getTransactionReceipt(txId);

    return receipt;
  } catch (error) {
    console.log('[ERROR] getTransactionReceipt', error);

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
      const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
      const web3 = new Web3(web3Provider);
      const contract = getContract(web3);
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

  /**
   * TODO: Esto es para habilitar auto reconexión, revisar parametros para afinar.
   */
  const options = {
    reconnect: {
      auto: true,
      delay: 5000,//ms
      maxAttempts: 100,
      onTimeout: false
    }
  };

  const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS, options);
  const web3 = new Web3(web3Provider);
  const contract = getContract(web3);

  contract.events.RBTCSwapOut().on('data', async function (event) {
    const blockNumber = _.get(event, 'blockNumber');
    const transactionHash = _.get(event, 'transactionHash');
    const { source: senderAddress, amount: value } = _.get(event, 'returnValues', {});
    const amount = web3.utils.fromWei(value);

    console.log(`\n[RBTCSwapOut] Tx recv: ${transactionHash}\n[RBTCSwapOut] Sender: ${senderAddress}\n[RBTCSwapOut] Amount: ${amount}`);

    try {
      const order = await ordersModel.findOne({
        'rsk.senderAddress': senderAddress,
        'rsk.status': PENDING,
        flow: RBTC_TO_BTC,
        deleted: false
      });

      if (_.isEmpty(order)) {
        console.log(`[+] No order found corresponding to senderAddress: ${senderAddress}, ignoring ..`);
        return;
      }

      console.log(`[RBTCSwapOut] Order found: ${order._id}, processing ...\n`);

      if (amount < order.value) {
        console.log(`[RBTCSwapOut] Order ${order._id}: sent less value than needed.\n`);
        order.rsk.status = FAILED;
        let _msg = `Address ${senderAddress} sent ${amount} and ${order.value} expected. Marking rsk.status as failed.`
        sendTelegramAlert(_msg);
      } else {
        console.log(`[RBTCSwapOut] Order ${order._id}: Value transfered is correct, saving order new status: UNCONFIRMED`);

        order.rsk.block = blockNumber;
        order.rsk.status = UNCONFIRMED;
        order.rsk.txId = transactionHash;
      }

      await order.save();
    } catch (error) {
      console.log(`[ERROR] On listen RBTCSwapOut. ${error}`);
    }
  }).on('connected', wsId => console.log("RSK WS connected with id:", wsId))
    .on('error', e => {
      let _msg = `[ALERT] RSKSwapOut connection ERROR: ${e}`;
      console.log(_msg);
      sendTelegramAlert(_msg);
    })
    .on("close", e => {
      let _msg = `[ALERT] WebSocket connection CLOSED: ${e}`;
      console.log(_msg);
      sendTelegramAlert(_msg);
    })
    .on('end', e => {
      console.log('WS closed, reason:', e);
      let _msg = `[ALERT] RSKSwapOut connection END: ${e}`;
      sendTelegramAlert(_msg);
    });


}

module.exports = {
  getBlockNumber,
  getTransactionReceipt,
  listenRBTCSwapOut,
  swapIn
};
