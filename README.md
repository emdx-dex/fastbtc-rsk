# fastbtc-rsk

## Infra overview

![alt text](./fast-btc.png)

## Endpoints

### POST /api/order

Creates the order. Add hook in Blocknative to listen for transactions in the address.

#### Body
```
{
  "rbtcAddress": ...,
  "value": ...
}
```

### GET /api/order

Get all the orders

### GET /api/order/:id

Get order by id

## Webhooks

### POST /api/webhook/address

Blocknative webhook when addres receives transaction.
