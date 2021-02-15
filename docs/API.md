# API

## Endpoints

### POST /api/order

Creates the order and register address in Blocknative to listen for transactions in the address.

### Body
```
{
  "rbtcAddress": ...,
  "value": ...
}
```

### GET /api/order

Get all the orders.

### GET /api/order/:id

Get an order by id.

## Webhooks

### POST /api/webhook/address

Blocknative webhook when registered addres receives a transaction.
