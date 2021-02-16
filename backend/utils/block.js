const _ = require('lodash');
const axios = require('axios');

require('dotenv').config();

const BTC_INFO_URL = process.env.BTC_INFO_URL;

async function getBlockNumber() {
  try {
    const response = (await axios.get(BTC_INFO_URL)).data
    const blockNumber = response.height;
    return blockNumber;
  } catch (error) {
    console.log(error);
    return 0;
  }
}

module.exports = {
  getBlockNumber
};

