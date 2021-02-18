require('dotenv').config();

const isLocal = process.env.ENV === 'local';
const isTest = process.env.ENV === 'test';
const isProduction = process.env.ENV === 'production';

module.exports = {
  isLocal,
  isTest,
  isProduction
};
