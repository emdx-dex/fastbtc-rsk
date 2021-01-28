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
}, schemaConfig);

const addressesModel = model('conversionsModel', addressesSchema);

module.exports = conversionsModel;
