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
  side: String,
  btcDepositAddress: String,
  rbtcTransferAddress: String,
  txId: String,
  block: Number
}, schemaConfig);

const ordersModel = model('ordersModel', ordersSchema);

module.exports = ordersModel;
