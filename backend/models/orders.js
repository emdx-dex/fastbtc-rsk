const { Schema, model } = require('mongoose');

const schemaConfig = {
  toJSON: {
    virtuals: true,
    getters: true
  },
  collection: 'orders',
  timestamps: true
};

const ordersSchema = new Schema({
  value: String,
  btc: {
    address: String,
    block: String,
    status: String,
    txId: String,
  },
  rsk: {
    address: String,
    block: String,
    status: String,
    txId: String
  },
  side: {
    type: String,
    enum : ['btcToRbtc','RbtcToBtc'],
    default: 'btcToRbtc'
  }
}, schemaConfig);

const ordersModel = model('ordersModel', ordersSchema);

module.exports = ordersModel;
