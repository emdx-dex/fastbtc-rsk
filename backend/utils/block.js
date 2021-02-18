const _ = require('lodash');
const axios = require('axios');
const ElectrumClient = require('@codewarriorr/electrum-client-js');

require('dotenv').config();

const BTC_ELECTRUM_PORT = process.env.BTC_ELECTRUM_PORT;
const BTC_ELECTRUM_PROTOCOL = process.env.BTC_ELECTRUM_PROTOCOL;
const BTC_ELECTRUM_URI = process.env.BTC_ELECTRUM_URI;
const BTC_INFO_URL = process.env.BTC_INFO_URL;

let client;

async function connect() {
  try {
    if (_.isEmpty(client)) {
      client = new ElectrumClient(
        BTC_ELECTRUM_URI,
        BTC_ELECTRUM_PORT,
        BTC_ELECTRUM_PROTOCOL
      );
      await client.connect();
    }
    return client;
  } catch (error) {
    console.log(error);
    return error;
  }
};

/**
 * Get latest block by querying some API service. 
 */
async function getBlockNumberApi() {
  try {

    const response = await axios.get(`${BTC_INFO_URL}/blocks?limit=1`);
    const blockNumber = _.get(response, 'data.data[0].id', {});

    return blockNumber;
  } catch (error) {
    console.log(error);

    return -1;
  }
}

/**
 * Get the latest block by subscribing to electrum blockheaders and then closing the client
 * If return -1 then error happened.
 */
async function getBlockNumberElectrumX() {
  try {
    const client = await connect();
    const { height } = await client.blockchain_headers_subscribe();
    return height;
  } catch (error) {
    console.log(error);
    await client.close();
    return -1;
  }
}

/**
 * Intento fetchear el latestBlock de Electrum primero.
 * Si fallo intento de la api de Blockchair
 * Sino devuelvo -1 y alerto.
 */
async function getBlockNumber() {

  let latestBlock;

  latestBlock = await getBlockNumberElectrumX();

  if (latestBlock != -1)
    return latestBlock;

  //Alert()
  latestBlock = await getBlockNumberApi();

  if (latestBlock != -1)
    return latestBlock;

  //Alert()
  return -1;

}

module.exports = {
  getBlockNumber: getBlockNumber
};
