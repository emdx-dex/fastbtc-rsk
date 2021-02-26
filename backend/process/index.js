const { createWatchdogTimer } = require('watchdog-timer');
const { processSwapOut } = require('../rsk/index');
const checkBalances = require('./check-balances');
const cleanUpOrders = require('./clean-orders');
const updateStatus = require('./update-status');

require('dotenv').config();

// TODO: revisar que el tiempo sea optimo por cada chain.
(async function () {
  require('../utils/connection');

  const ONE_MINUTE_IN_MILISECONDS = 60000;
  const WATCHDOG_TIMEOUT_IN_MILISECONDS = ONE_MINUTE_IN_MILISECONDS + 15000;

  const watchdogTimer = createWatchdogTimer({
    onTimeout: () => {
      console.error('[-] Watchdog timer timeout; forcing program termination.');

      process.nextTick(() => {
        process.exit(1);
      });
    },
    timeout: WATCHDOG_TIMEOUT_IN_MILISECONDS,
  });

  await cleanUpOrders();
  await processSwapOut();
  await updateStatus();
  await checkBalances();

  setInterval(async () => {

    /**
     * Este es el reset del timer, si no pasa por acá durante WATCHDOG_TIMEOUT_IN_MILISECONDS mata el proceso.
     * Comentar para deshabilitar watchdog.
     */
    watchdogTimer.reset();
    console.log("WatchDog timer resets, no process killing ..\n");

    await processSwapOut();
    await cleanUpOrders();
    await updateStatus();
    await checkBalances();

  }, ONE_MINUTE_IN_MILISECONDS);
}());
