# fastbtc-rsk

## Infra overview

![alt text](./fast-btc.png)

## Endpoints

### POST /api/order

Creates the order. Add hook in Blocknative to listen for transactions in the address.

#### Body
```
{
  "address": ...
}
```

## Webhooks

### POST /api/webhook/address

Blocknative webhook when addres receives transaction.
