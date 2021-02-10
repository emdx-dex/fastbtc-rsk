const ElectrumClient = require('@codewarriorr/electrum-client-js');
const bitcoinjs = require('bitcoinjs-lib');
const coinSelect = require('coinselect')
const axios = require('axios');

require('dotenv').config();

// Public Electrum server list: https://1209k.com/bitcoin-eye/ele.php?chain=btc
async function connect() {
  try {
    
    const client = new ElectrumClient(
      "tn.not.fyi",
      55002,
      "ssl"
    );
  
    await client.connect();
  
    console.log('------------------------------------------------');
    
    return client;  
  } catch (error) {
    console.log(error);    
  }
}
/**
 * Get feeRate in Satothis to calculate total fee
 */
async function getFeeRates() {

  let feeRate;
  let binfoFees = await axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended');
  feeRate = binfoFees.data.fastestFee;//TODO: select better option
  return feeRate;
  
}

/**
 * Validates any address, including legacy, p2sh and bech32
 * @param address
 * @returns {boolean}
 */
function isAddressValid(address, _network) {
  try {
    bitcoinjs.address.toOutputScript(address, _network);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * 
 * @param {address from send funds} _FROM base58
 * @param {adress(s)  to send} _TO base58
 * @param {value to send} _VALUE integer in SATS
 * @param {boolean} _IS_SEGWIT to construct inputs/outputs
 * @param {testnet|mainnet} _NETWORK string
 */
async function createUnsignedRawtx(_FROM, _TO, _VALUE, _IS_SEGWIT=false, _NETWORK='testnet'){

  try {
    
    let network;
    _NETWORK=='testnet' ? network = bitcoinjs.networks.testnet : network = bitcoinjs.networks.bitcoin;

    if(!_FROM || !_TO || !_VALUE)
      return "Missing Parameters";
    
    if(!isAddressValid(_FROM, network) || !isAddressValid(_TO, network))
      return "Invalid Address";
    
    let client = await connect();//TODO: check network/testnet before this
    
    const script = bitcoinjs.address.toOutputScript(_FROM, network);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);

    let feeRate = await getFeeRates();
    
    if(!feeRate)
      return "Unable to fetch fee rates, aborting";

    let proccessedUTXOs =  [];
    let bufferRawTx;

    await Promise.all(UTXOs.map(async (i) => {
      
      bufferRawTx = Buffer.from(await client.blockchain_transaction_get(i.tx_hash), 'hex');

      proccessedUTXOs.push({
        txId: i.tx_hash,
        vout: i.tx_pos,
        value: i.value,
        nonWitnessUtxo: bufferRawTx
      })
    }));

    let targets = [
      {
        address: _TO,
        value: _VALUE
      }
    ];//TODO: multiple targets?

    let { inputs, outputs, fee } = coinSelect(proccessedUTXOs, targets, feeRate);

    if (!inputs || !outputs)
      return "No coin selection solution found; check if enough balance"

    let psbt = new bitcoinjs.Psbt({network: network});

    inputs.forEach(input =>
      psbt.addInput({
        hash: input.txId,
        index: input.vout,
        nonWitnessUtxo: input.nonWitnessUtxo,
        // OR (not both)
        //witnessUtxo: input.witnessUtxo,
      })
    )
    
    outputs.forEach(output => {
      // watch out, outputs may have been added that you need to provide
      // an output address/script for
      if (!output.address) 
        output.address = _FROM;//CHANGE_ADDRESS
  
      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    });
    
    let unsignedRawTx = {
      inputs: inputs,
      outputs: outputs,
      fees: fee,
      rawTx: psbt.toHex(),
    }
    
    return unsignedRawTx;
    
  } catch (error) {
    console.log(error);
  }

}

/**
 * 
 * @param {base58 addr} _FROM string
 * @param {base58 addr} _TO string
 * @param {target value in SATOSHIS} _VALUE integer
 * @param {bitcoinlib-js keypair format} _KEYPAIR object
 * @param {if segwit for UTXO processing} _IS_SEGWIT boolean
 * @param {testnet|mainnet} _NETWORK string
 */
async function createAndSignTx(_FROM, _TO, _VALUE, _KEYPAIR, _IS_SEGWIT=false, _NETWORK='testnet'){

  try {
    
    let network;
    _NETWORK=='testnet' ? network = bitcoinjs.networks.testnet : network = bitcoinjs.networks.bitcoin;

    if(!_FROM || !_TO || !_VALUE)
      return "Missing Parameters";
    
    if(!isAddressValid(_FROM, network) || !isAddressValid(_TO, network))
      return "Invalid Address";
    
    let client = await connect();//TODO: check network/testnet before this
    
    const script = bitcoinjs.address.toOutputScript(_FROM, network);
    const hash = bitcoinjs.crypto.sha256(script);
    const reversedHash = new Buffer.from(hash.reverse());
    const rScriptHash = reversedHash.toString('hex');

    const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);

    let feeRate = await getFeeRates();

    if(!feeRate)
      return "Unable to fetch fee rates, aborting";

    let proccessedUTXOs =  [];
    let bufferRawTx;

    await Promise.all(UTXOs.map(async (i) => {
      
      bufferRawTx = Buffer.from(await client.blockchain_transaction_get(i.tx_hash), 'hex');

      proccessedUTXOs.push({
        txId: i.tx_hash,
        vout: i.tx_pos,
        value: i.value,
        nonWitnessUtxo: bufferRawTx
      })
    }));

    let targets = [
      {
        address: _TO,
        value: _VALUE
      }
    ];//TODO: multiple targets?

    let { inputs, outputs, fee } = coinSelect(proccessedUTXOs, targets, feeRate);


    if (!inputs || !outputs)
      return "No coin selection solution found; check if enough balance"

    let psbt = new bitcoinjs.Psbt({network: network});

    inputs.forEach(input =>
      psbt.addInput({
        hash: input.txId,
        index: input.vout,
        nonWitnessUtxo: input.nonWitnessUtxo,
        // OR (not both)
        //witnessUtxo: input.witnessUtxo,
      })
    )
    
    outputs.forEach(output => {
      // watch out, outputs may have been added that you need to provide
      // an output address/script for
      if (!output.address) 
        output.address = _FROM;//CHANGE_ADDRESS
  
      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    });

    psbt.signAllInputs(_KEYPAIR);
    psbt.finalizeAllInputs();

    let rawSignedTx = psbt.extractTransaction().toHex();

    let signedRawTx = {
      inputs: inputs,
      outputs: outputs,
      fees: fee,
      size: Buffer.byteLength(rawSignedTx, 'hex')+ " bytes",
      signedRawTx: rawSignedTx
    }
    
    return signedRawTx;
    
  } catch (error) {
    console.log(error);
  }
  
}
/**
 * 
 * @param {complete raw tx to relay in hex} hexTx hex
 */
async function relaySignedTx(hexTx){

  try {
    let client = await connect();//TODO: check network/testnet before this

    if(!hexTx)
      return "Missing rawHexTx parameter";
  
    let broadcastResult = await client.blockchain_transaction_broadcast(hexTx);
    return broadcastResult;

  } catch (error) {
    return error;
  }

};


(async function(){

  /*
  Examples
  Unsigned Raw Tx
  
  console.log(await createUnsignedRawtx("n2CXXfYf7hJJHoqwjhLaj7LTWGM1q4jaFs", "mtjtgipED7zKRpSFTZMJ6jAvGs65o2TVTY", 6948));
  */
  /*
  rawTx signed with KeyPair
  
  
  let network = bitcoinjs.networks.testnet;
  const RSKKeypair = bitcoinjs.ECPair.fromWIF(
  'cMzvMy9A1J4vWdgnm9UwfvzhCrDZXqEgYdYcXM7dx26cERnKgrKX',
  network
  );

  let getSignedRawTx = await createAndSignTx("n2CXXfYf7hJJHoqwjhLaj7LTWGM1q4jaFs", "n3xP42DuRgoKFCULocue3HnvTVB8bsyqjj", 100000, RSKKeypair);

  let broadcastTx = await relaySignedTx(getSignedRawTx.signedRawTx);
  
  console.log(broadcastTx);
    */

})()

module.exports = {
  isAddressValid: isAddressValid,
  createUnsignedRawtx: createUnsignedRawtx,
  createAndSignTx: createAndSignTx,
  relaySignedTx: relaySignedTx
}