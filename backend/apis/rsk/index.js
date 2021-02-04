const abi = require('../../../contracts/abi/FastSwap.abi.json');
const web3 = require('web3');

function getContract() {
  const contract = new web3.eth.Contract(abi, '0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe');

  return contract;
}

function syncRBTCSwapOut() {
  const contract = getContract();

  contract.events.RBTCSwapOut({}, function () {
  });
}

module.exports = {
  syncRBTCSwapOut
};



