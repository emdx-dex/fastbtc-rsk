const { getBTCAddressBalance, getRSKAddressBalance } = require('../utils/address');
const { sendTelegramAlert } = require('../utils/alerts');

require('dotenv').config();

const MAX_VALUE = process.env.APP_TRANSFER_MAX;
const MIN_VALUE = process.env.APP_TRANSFER_MIN;

/**
 * Get balances of RSKSWAP important addresses.
 */
async function fastSwapBalances() {
  try {
    let btcHotAddrBalance = await getBTCAddressBalance(process.env.BTC_HOT_WALLET_ADDR);
    //let btcMultiSigAddrBalance = await getBTCAddressBalance();
    let rskContractBalance = await getRSKAddressBalance(process.env.FAST_SWAP_ADDRESS.toLowerCase());

    return {
      btc: {
        hot: {
          address: process.env.BTC_HOT_WALLET_ADDR,
          balance: btcHotAddrBalance
        }
      },
      rsk: {
        address: process.env.FAST_SWAP_ADDRESS,
        balance: rskContractBalance
      }
    };

  } catch (error) {
    console.log(error);
    return {};
  }

};

/**
 * 
 * @param {Address to alert of} _addr String
 * @param {balance} _value number
 */
async function lowBalanceAlert(_addr, _value) {
  try {
    let msg = `Address: ${_addr} with balance: ${_value} is running low.`
    await sendTelegramAlert(msg);
  } catch (error) {
    console.log(error);
    return error;
  }
}

/**
 * Check all balances and send Telegram alerts accordingly.
 */
async function checkBalances() {
  try {
    console.log("Checking fastswap balances ..");

    let balances = await fastSwapBalances();

    const MIN_RSK_VALUE = MIN_VALUE;
    const MIN_BTC_VALUE = MIN_VALUE;

    if (balances.rsk.balance <= MIN_RSK_VALUE)
      await lowBalanceAlert(balances.rsk.address, balances.rsk.balance);

    if (balances.btc.hot.balance <= MIN_BTC_VALUE)
      await lowBalanceAlert(balances.btc.hot.address, balances.btc.hot.balance);

    console.log("Fastswap balance check done, all good.");

  } catch (error) {
    console.log(error);
    return -1;
  }
}

module.exports = checkBalances;
