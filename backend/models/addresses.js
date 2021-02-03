const { Schema, model } = require('mongoose');

const schemaConfig = {
  toJSON: {
    virtuals: true,
    getters: true
  },
  collection: 'addresses',
  timestamps: true
};

const addressesSchema = new Schema({
  used: {
    type: Boolean,
    default: false
  },
  address: String,
  pubkey: String,
  derivationIndex: Number,
  // orderId: {
  //   type: mongoose.Types.ObjectId,
  //   ref: 'orders'
  // }
}, schemaConfig);

const addressesModel = model('addressesModel', addressesSchema);

module.exports = addressesModel;
