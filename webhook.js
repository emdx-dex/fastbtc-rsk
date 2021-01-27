exports.balanceWebhook = async (req) => {

  const {
    status,
    system,
    network,
    hash,
    from,
    to,
    value,
    txid,
    netBalanceChanges,
    watchedAddress,
    contractCall
  } = req.body;


  if (system == "ethereum" && status != 'confirmed')
    return { data: null, error: null, message: 'Recv unconfirmed tx, ignoring..' };

  if (system == "bitcoin" && status != 'confirmed')
    return { data: null, error: null, message: 'Recv unconfirmed tx, ignoring..' };

  /*
    Ethereum on Kovan
   */
  if (system == "ethereum" && network == "kovan" && contractCall == undefined) {//TODO: NETWORK selector in the future

    let { data } = await userService.getByAddress(to);
    let currency = await Currency.findOne({ id: req.body.asset.toLowerCase() });
    let marketId = (await Market.findOne({ id: "ethusd" }))._id;
    let ethUsdIndexPrice = (await Indexes.findOne({market: marketId}).sort({createdAt: -1}).exec()).indexPrice;

    if (data.length < 1)
      return { data: null, error: true, message: 'No wallet found' };

    let user = data[0];

    let WEI = 1000000000000000000;

    let valueInEth = (value / WEI);

    let ethUsd = ethUsdIndexPrice;

    return this.deposit(user._id, valueInEth, currency._id, ethUsd, hash, req)
      .then(updatedBalance => {
        return {
          data: updatedBalance, error: null, message: ''
        };
      })
      .catch(error => {
        console.log(error);
        return {
          data: null, error: error, message: 'Error updating balance'
        };
      });


  }

  /*
    IEMDX on Kovan
   */
  if (system == "ethereum" && network == "kovan" && contractCall != undefined) {//TODO: NETWORK selector/contract addr in the future

    let IEMDXTESTNET = "0x6fdad8993714c37e02eb929c81b93c397931fe51";

    if (contractCall.contractAddress.toLowerCase() != IEMDXTESTNET)
      return { data: null, error: null, message: 'Not IEMDX token transfer' };

    let { data } = await userService.getByAddress(contractCall.params._to);
    let currency = await Currency.findOne({ id: req.body.asset.toLowerCase() });

    let marketId = (await Market.findOne({ id: "usdtusd" }))._id;
    let usdtUsdIndexPrice = (await Indexes.findOne({ market: marketId }).sort({ createdAt: -1 })).indexPrice;

    if (data.length < 1)
      return { data: null, error: true, message: 'No wallet found' };

    let user = data[0];

    let iemdxValue = contractCall.decimalValue;

    let conversionRate = 0.003125 * usdtUsdIndexPrice;

    return this.deposit(user._id, iemdxValue, currency._id, conversionRate, hash, req)
      .then(updatedBalance => {
        return {
          data: updatedBalance, error: null, message: ''
        };
      })
      .catch(error => {
        console.log(error);
        return {
          data: null, error: error, message: 'Error updating balance'
        };
      });

  }

  /*
    USDT on Kovan
   */
  if (system == "ethereum" && network == "kovan" && contractCall != undefined) {//TODO: NETWORK selector/contract addr in the future

    let USDTTESTNET = "0x1bc6097227087E9830832D38D3897ABE5FB6a7a3";

    if (contractCall.contractAddress.toLowerCase() != USDTTESTNET)
      return { data: null, error: null, message: 'Not USDT token transfer' };

    let { data } = await userService.getByAddress(contractCall.params._to);
    let currency = await Currency.findOne({ id: req.body.asset.toLowerCase() });

    let marketId = (await Market.findOne({ id: "usdtusd" }))._id;
    let usdtUsdIndexPrice = (await Indexes.findOne({ market: marketId }).sort({ createdAt: -1 })).indexPrice;

    if (data.length < 1)
      return { data: null, error: true, message: 'No wallet found' };

    let user = data[0];

    let usdtValue = contractCall.decimalValue;

    let usdtusd = usdtUsdIndexPrice;

    return this.deposit(user._id, usdtValue, currency._id, usdtusd, hash, req)
      .then(updatedBalance => {
        return {
          data: updatedBalance, error: null, message: ''
        };
      })
      .catch(error => {
        console.log(error);
        return {
          data: null, error: error, message: 'Error updating balance'
        };
      });

  }

  /*
    Bitcoin on testnet
   */
  if (system == "bitcoin" && network == "testnet") {//TODO: change the hoook to CONFIRMED tx intead of unconfirmed

    let { data } = await userService.getByAddress(watchedAddress);
    let currency = await Currency.findOne({ id: req.body.asset.toLowerCase() });

    let marketId = (await Market.findOne({ id: "btcusd" }))._id;
    let btcUsdIndexPrice = (await Indexes.findOne({ market: marketId }).sort({ createdAt: -1 })).indexPrice;

    if (data.length < 1)
      return { data: null, error: true, message: 'No wallet found' };

    let user = data[0];

    let btcUsd = btcUsdIndexPrice;

    let btcValue;

    netBalanceChanges.forEach(el => {
      if (el.address.toLowerCase() == watchedAddress)
        btcValue = el.delta;
    });

    return this.deposit(user._id, btcValue, currency._id, btcUsd, txid, req)
      .then(updatedBalance => {
        return {
          data: updatedBalance, error: null, message: ''
        };
      })
      .catch(error => {
        console.log(error);
        return {
          data: null, error: error, message: 'Error updating balance'
        };
      });


  }

};