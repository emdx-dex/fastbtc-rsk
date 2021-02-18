const _ = require('lodash');
const Web3 = require('web3');

require('dotenv').config();

let web3;

function getInstance() {
  if (web3) return web3;

  const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS);

  web3 = new Web3(web3Provider);

  return web3;
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

module.exports = {
  getBlockNumber
};
