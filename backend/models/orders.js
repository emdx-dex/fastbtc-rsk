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
  block: Number,
  btcDepositAddress: String,
  rbtcTransferAddress: String,
  side: String,
  txId: String,
  value: String
}, schemaConfig);

const ordersModel = model('ordersModel', ordersSchema);

module.exports = ordersModel;
