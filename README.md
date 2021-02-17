# fastbtc-rsk

## Index

* [API](/docs/API.md)
* [SETUP](/docs/SETUP.md)

### TODO

* Better UX/UI per-side confirmation completion on tx N confirmations [x]
* On RBTC to BTC decide on wallet, tx construction and automatic relay depending on value being transfered [x]
* Functions to fetch Hot/MultiSig on BTC wallet and RSK contrat balance. [-]@maxidev
* Sanitize client side inputs and validate base58/ETH address type to avoid user entering wrong address type or garbage [] @conrado/@maxidev
* Fine grain RSK Contract consumption calculation [] @sebastian
* Check if Electrumx server can be use to get latest block on BTC [] @maxidev
* On front end show an estimate time for conversion completion depending on the total order.value (given the routing order transaction depending on order.value) [] @conrado/@agustin
* cleanUp() on process-status of pending orders and createdTime > 1h : mark as deleted /BTC_RTBTC -> unwatch [] @maxidev
* On clear_order on front end -> cleanUp(orderId) / Review polling / bug shown on video that changes orders [] @agustin

* Separate orders table app from client's order view | new endpoint to set txId on hot_wallet unsigned / multisig [] @maxidev @agustin

## Infrastructure overview

![alt text](./fast-btc.png)
