const _ = require('lodash');
const { FAILED, PENDING, UNCONFIRMED } = require('../../shared/status');
const abi = require('../../contracts/abi/FastSwap.abi.json');
const ordersModel = require('../models/orders');
const Web3 = require('web3');

let web3;

function getInstance() {
  if (web3) return web3;

  const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS);

  web3 = new Web3(web3Provider);

  return web3;
}

async function getBlockNumber() {
  const web3 = getInstance();
  const blockNumber = await web3.eth.getBlockNumber();

  return blockNumber;
}

function listenRBTCSwapOut() {
  const fastSwapAddress = process.env.FAST_SWAP_ADDRESS;
  const web3 = getInstance();
  const contract = new web3.eth.Contract(abi, fastSwapAddress.toLowerCase());

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
      console.log('RBTCSwapOut Error: ', error);
    }
  });
}

module.exports = {
  getBlockNumber,
  listenRBTCSwapOut
};



