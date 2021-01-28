# fastbtc-rsk

## Infra overview

![alt text](./fast-btc.png)

## Endpoints

### POST /order

Creates the order. Add hook in blocknative to listen for transactions in the address.

#### Body
```
{
  "address": ...
}
```
