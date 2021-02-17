const _ = require('lodash');
const axios = require('axios');
const ElectrumClient = require('@codewarriorr/electrum-client-js');

require('dotenv').config();

const BTC_INFO_URL = process.env.BTC_INFO_URL;


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
};

/**
 * Get latest block by querying some API service. 
 */
async function getBlockNumber() {
  try {
    const response = await axios.get(`${BTC_INFO_URL}/blocks?limit=1`);
    const blockNumber = _.get(response, 'data.data[0].id', {});

    return blockNumber;
  } catch (error) {
    return -1;
  }
}
/**
 * Get the latest block by subscribing to electrum blockheaders and then closing the client
 * TODO: optimize it.
 * If return -1 then error happened.
 */
async function getLatestBlockElectrumX() {
  try {

    let client = await connect();
    let { height } = await client.blockchain_headers_subscribe();

    await client.close();

    return height;

  } catch (error) {
    console.log(error);
    return -1;
  }
}

module.exports = {
  getBlockNumber: getBlockNumber,
  getLatestBlockElectrumX: getLatestBlockElectrumX
};

