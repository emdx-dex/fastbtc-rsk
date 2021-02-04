const abi = require('../../contracts/abi/FastSwap.abi.json');
const Web3 = require('web3');

function getContract() {
  const fastSwapAddress = process.env.FAST_SWAP_ADDRESS;
  // const web3Provider = new Web3.providers.WebsocketProvider(process.env.RSK_WS);
  const web3Provider = new Web3.providers.HttpProvider(process.env.RSK_RPC);
  const web3 = new Web3(web3Provider);
  const contract = new web3.eth.Contract(abi, fastSwapAddress.toLowerCase());

  return contract;
}

function listenRBTCSwapOut() {
  const contract = getContract();

  contract.getPastEvents('OwnershipTransferred', { fromBlock: 1 }, console.log)

  // contract.events.RBTCSwapOut({}, function (props) {
  //   console.log(props);
  // });
}

module.exports = {
  listenRBTCSwapOut
};



