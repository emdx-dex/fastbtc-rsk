
const ElectrumClient = require('@codewarriorr/electrum-client-js');
require('dotenv').config();

async function connect() {
  try {

    let ss = process.env.BTC_ELECTRUM_SERVERS.split(",");
    let server = ss[Math.floor(Math.random() * Math.floor(ss.length))].split("|");
    console.log("Connecting to:", server);

    const BTC_ELECTRUM_URI = server[0];
    const BTC_ELECTRUM_PORT = server[1];
    const BTC_ELECTRUM_PROTOCOL = server[2];

    let client = new ElectrumClient(
      BTC_ELECTRUM_URI,
      BTC_ELECTRUM_PORT,
      BTC_ELECTRUM_PROTOCOL
    );

    await client.connect();
    
    return client;
  } catch (error) {
    console.log("Failed to connect to ElectrumX server, retrying ..");
    await connect();
  }
}

module.exports = {
  connect
};