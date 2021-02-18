const _ = require('lodash');
const axios = require('axios');
const ElectrumClient = require('@codewarriorr/electrum-client-js');

require('dotenv').config();

const BTC_ELECTRUM_PORT = process.env.BTC_ELECTRUM_PORT;
const BTC_ELECTRUM_PROTOCOL = process.env.BTC_ELECTRUM_PROTOCOL;
const BTC_ELECTRUM_URI = process.env.BTC_ELECTRUM_URI;
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
 * Get the latest block by subscribing to electrum blockheaders and then closing the client
 * If return -1 then error happened.
 */
async function getBlockNumber() {
  try {
    const client = await connect();
    const { height } = await client.blockchain_headers_subscribe();

    return height;
  } catch (error) {
    console.log(error);

    return -1;
  }
}

module.exports = {
  getBlockNumber
};

