const { getBlockNumber } = require('../utils/block');
const { getBlockNumber: getRSKBlockNumber } = require('../rsk/index');
const blocksModel = require('../models/blocks');

async function updateBlocks() {
  try {
    console.log('Running updateBlocks() ...');

    const btcBlockNumber = await getBlockNumber();
    const rskBlockNumber = await getRSKBlockNumber();

    const block = new blocksModel({
      btc: btcBlockNumber,
      rsk: rskBlockNumber
    });
  
    await block.save();  

    console.log('Finish updateBlocks() ...');
  } catch (error) {
    console.log('[ERROR] updateBlocks', error.message);  
  }
}

module.exports = updateBlocks;
