const _ = require('lodash');
const axios = require('axios');

require('dotenv').config();

const BTC_INFO_URL = process.env.BTC_INFO_URL;

async function getBlockNumber() {
  try {
    const response = await axios.get(`${BTC_INFO_URL}/blocks?limit=1`);
    const blockNumber = _.get(response, 'data.data[0].id', {});

    return blockNumber;
  } catch (error) {
    return 0;
  }
}

module.exports = {
  getBlockNumber
};

