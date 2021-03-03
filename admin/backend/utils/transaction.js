const ElectrumClient = require('@codewarriorr/electrum-client-js');

require('dotenv').config();

var ss = process.env.BTC_ELECTRUM_SERVERS.split(",");
var server = ss[Math.floor(Math.random() * Math.floor(ss.length))].split("|");

const BTC_ELECTRUM_URI = server[0];
const BTC_ELECTRUM_PORT = server[1];
const BTC_ELECTRUM_PROTOCOL = server[2];

// Public Electrum server list: https://1209k.com/bitcoin-eye/ele.php?chain=btc
async function connect() {
  try {
    let client;
    client = new ElectrumClient(
      BTC_ELECTRUM_URI,
      BTC_ELECTRUM_PORT,
      BTC_ELECTRUM_PROTOCOL
    );
    await client.connect();
    return client;
  } catch (error) {
    console.log("SERVER: " + BTC_ELECTRUM_PROTOCOL + " " + BTC_ELECTRUM_URI + " " + BTC_ELECTRUM_PORT);
    console.log(error);
    return error;
  }
};

async function getBTCTxConfirmations(txId) {

  try {

    if (!txId)
      return "Missing txId (hash) parameter";

    console.log(`Getting confirmations for tx: ${txId}`);

    let client = await connect();
    let txInformation = await client.blockchain_transaction_get(txId, true);

    let confirmations;

    txInformation.confirmations ? confirmations = txInformation.confirmations : confirmations = 0;

    await client.close();

    return confirmations;

  } catch (error) {
    console.log(error);
    return error;
  }
}

async function validateTxId(txId) {
  try {
    const client = await connect();
    const tx = await client.blockchain_transaction_get(txId, true);

    await client.close();

    return true;
  } catch (error) {
    return false;
  }
}

module.exports = {
  getBTCTxConfirmations,
  validateTxId
}
