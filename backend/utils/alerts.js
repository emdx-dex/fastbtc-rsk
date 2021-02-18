const _ = require('lodash');
const axios = require('axios');

require('dotenv').config();

const TG_BOT_URL = "https://teksfunctions.azurewebsites.net/api/telegram-alert-rswap?code=";
const TG_BOT_KEY = process.env.TG_BOT_KEY;

async function sendTelegramAlert(_msg) {

  try {
    if (!_msg)
      return "Missing parameter";

    let alertMsg = _msg;
    let TG_QUERY = `${TG_BOT_URL}${TG_BOT_KEY}&name=${alertMsg}`;

    console.log("Sending Alert:", alertMsg);
    let sendQuery = await axios.get(TG_QUERY);
    
    console.log(sendQuery.data);
    
    return;

  } catch (error) {
    console.log("Failed to send Telegram Alert");
    console.log(error);
    return;
  }

}

module.exports = {
  sendTelegramAlert: sendTelegramAlert
};

