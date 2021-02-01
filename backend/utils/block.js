const _ = require('lodash');
const axios = require('axios');

const BLOCKCHAIN_INFO_URL = process.env.BLOCKCHAIN_INFO;

async function getLastBlock() {
  const response = await axios.get(`${BLOCKCHAIN_INFO_URL}/blocks?limit=1`);

  return _.get(response, 'data.data[0]', {});
}

module.exports = {
  getLastBlock
};

