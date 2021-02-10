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

    let feeRate;
    let binfoFees = await axios.get('https://bitcoinfees.earn.com/api/v1/fees/recommended');
    
    feeRate = binfoFees.data.fastestFee;//TODO: select better option

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
    
    //console.log("inp", inputs)
    //console.log("out", outputs)
    //console.log("fees", fee/100000000*45000)

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
      if (!output.address) {
        output.address = _FROM;
        //wallet.nextChangeAddress()
      }
  
      psbt.addOutput({
        address: output.address,
        value: output.value,
      })
    })
    let unsignedRawTx = psbt.toHex();
    
    return unsignedRawTx;
    
  } catch (error) {
    console.log(error);
  }

}

(async function(){



  console.log(await createUnsignedRawtx("n2CXXfYf7hJJHoqwjhLaj7LTWGM1q4jaFs", "mh4LubQYEcJowCWWiLYerbHeavhPKsyntf", 15653602546546));
  return;

//https://testnet.smartbit.com.au/api PARA LOS UNSPENTS
  /*
  const psbt = new bitcoin.Psbt({ network: TESTNET })
   .addInput({
    hash: txid,
    index: vout,
    nonWitnessUtxo: Buffer.from(raw_tx,'hex')

   })
   .addOutput({
    address: recipient.address,
    value: recipient.amount,
   })
   .addOutput({
    address: utxo_address,
    value: spendable - recipient.amount - fee,
   })

   var p3 = psbt.fromHex(p2hex, { network: testnet });
   
   https://testnet.blockchain.info/rawtx/12edc018031fef88758c7010ac29e5c443741fa12873e6585add7c2cabde0940?format=hex
   https://github.com/bitcoinjs/bitcoinjs-lib/issues/1658

   FEE APIS:
   https://api.blockchain.info/mempool/fees*
   https://bitcoinfees.earn.com/api/v1/fees/recommended

  */
  
  try {


  let binfoFees = await axios.get('https://api.blockchain.info/mempool/fees');
  let regularFees = binfoFees.data.regular;

  const BTC_UNIT = 100000000;
  let feeRate = 55 // satoshis per byte
  
  log = console.log;
  
  const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);
  
  let finalUTXOs = [];
  
  // let RAW_HEX_TX_0 = Buffer.from(await client.blockchain_transaction_get(UTXOs[0].tx_hash), 'hex');
  // let RAW_HEX_TX_1 = Buffer.from(await client.blockchain_transaction_get(UTXOs[1].tx_hash), 'hex');

  let tempUTXOs =  [];

  let addrBalance = 0;


  await Promise.all(UTXOs.map(async (i) => {
    //log(i)
    log((await client.blockchain_transaction_get(i.tx_hash)))
    log("\n");
  }));

 
  return;
  

  UTXOs.forEach(utxo => {
    addrBalance+=utxo.value;
    tempUTXOs.push({
      txId: utxo.tx_hash,
      vout: utxo.tx_pos,
      value: utxo.value,
      // For use with PSBT:
      // not needed for coinSelect, but will be passed on to inputs later
      //nonWitnessUtxo: Buffer.from(RAW_HEX_TX, 'hex'),
    })
    let targets = [
      {
        address: 'mnmMhuMkURyu2Cn4K2A1TQiZCv6CN6FzRw',
        value: 3176315
      }
    ]
  });

  log("addrBalanace:", addrBalance/BTC_UNIT);

  finalUTXOs[0] = {
    txId: tempUTXOs[0].txId,
    vout: tempUTXOs[0].vout,
    value: tempUTXOs[0].value,
    nonWitnessUtxo: RAW_HEX_TX_0,
  };

  finalUTXOs[1] = {
    txId: tempUTXOs[1].txId,
    vout: tempUTXOs[1].vout,
    value: tempUTXOs[1].value,
    nonWitnessUtxo: RAW_HEX_TX_1,
  };

  //log(finalUTXOs);

  let targets = [
    {
      address: 'mnmMhuMkURyu2Cn4K2A1TQiZCv6CN6FzRw',
      value: 3176315
    }
  ]
  
  // ...
  let { inputs, outputs, fee } = coinSelect(finalUTXOs, targets, feeRate)
  

  let CHANGE_FROM_CS;
  
  let estimatedFee = await client.blockchain_transaction_broadcast(2312);
  log("ESTIMATED FEE ELECTRUMX", estimatedFee);
  return;

    
  //log(outputs);
  log("TARGET_VALUE:", 3176315/BTC_UNIT)
  outputs.forEach(out => {
    log(out);
    if(!out.address){
      CHANGE_FROM_CS = out.value/BTC_UNIT;
      log("OUTPUT CHANGE FROM CS:", CHANGE_FROM_CS);
      log("OUTPUT ADDR CHANGE:", out.address);
    }
    else{
      log("OUTPUT VALUE:",out.value/BTC_UNIT);
      log("OUTPUT ADDR:", out.address);
    }
  })
  log("FEE",fee/BTC_UNIT);


  log("Balance - Target:", (addrBalance -3176315)/BTC_UNIT);

  let calculatedChange = (addrBalance -3176315-fee)/BTC_UNIT;
  log("CHANGE (Balance - Target - Fee):", calculatedChange);

  log(CHANGE_FROM_CS == calculatedChange);

  return;

  //inputs and .outputs will be undefined if no solution was found
  if (!inputs || !outputs) return
  
  let psbt = new bitcoinjs.Psbt({network: network})
  
  inputs.forEach(input =>
    psbt.addInput({
      hash: input.txId,
      index: input.vout,
      nonWitnessUtxo: input.nonWitnessUtxo,
      // OR (not both)
      //witnessUtxo: input.witnessUtxo,
    })
  )
  console.log(outputs);
  outputs.forEach(output => {
    // watch out, outputs may have been added that you need to provide
    // an output address/script for
    if (!output.address) {
      output.address = "n2CXXfYf7hJJHoqwjhLaj7LTWGM1q4jaFs"
      //wallet.nextChangeAddress()
    }

    //console.log(output.address, output.value)
  
    psbt.addOutput({
      address: output.address,
      value: output.value,
    })
  })

  console.log(psbt.toHex());

  return;
  } catch (error) {
    console.log(error);
  }


  //log(UTXOs);
  //return;
  // RAW_HEX_TX.vout.forEach(vout => {
  //   log("Index:", vout.n);
  //   log("Value:", vout.value);
  //   log("scriptPubKey:", vout.scriptPubKey);
  // });
  //console.log(UTXOs);
  //console.log(RAW_HEX_TX);



  // let utxos = [
  //   {
  //     txId: UTXOs[0].tx_hash,
  //     vout: UTXOs[0].tx_pos,
  //     value: UTXOs[0].value,
  //     // For use with PSBT:
  //     // not needed for coinSelect, but will be passed on to inputs later
  //     nonWitnessUtxo: Buffer.from(RAW_HEX_TX, 'hex'),
  //     // OR
  //     // if your utxo is a segwit output, you can use witnessUtxo instead
  //     // witnessUtxo: {
  //     //   script: Buffer.from('... scriptPubkey hex...', 'hex'),
  //     //   value: 10000 // 0.0001 BTC and is the exact same as the value above
  //     // }
  //   }
  // ]
  
  // let targets = [
  //   {
  //     address: 'mg3VTMo3vLgTCyoXTyTkjMVqgwndE8wC5p',
  //     value: 5000
  //   }
  // ]
  
  // // ...
  // let { inputs, outputs, fee } = coinSelect(utxos, targets, feeRate)
  
  // // the accumulated fee is always returned for analysis
  // //console.log(fee);
  // console.log(inputs, outputs, fee);




  //console.log(RAW_HEX_TX);
  //return;
   //console.log(UTXOs);
   //console.log(asd);
  
  
  // let SEND_FROM = "mnqpyF88ZCmQcWbHXWKatYzfhMRW8gJqVD";
  // let SEND_TO = "mg3VTMo3vLgTCyoXTyTkjMVqgwndE8wC5p";
  
  // let TOTAL_UTXO_VALUE = 3276507;
  // let TARGET = 3176507;
  // let FEE = 1000;
  // let CHANGE = TOTAL_UTXO_VALUE-TARGET-FEE;

  // let psbt = new bitcoinjs.Psbt({ network: network })
  // .addInput({
  //   hash: UTXOs[0].tx_hash,
  //   index: UTXOs[0].tx_pos,
  //   nonWitnessUtxo: Buffer.from(RAW_HEX_TX,'hex')
  // })
  // .addOutput({
  //   address: SEND_TO,
  //   value: TARGET,
  // })
  // .addOutput({
  //   address: SEND_FROM,//CHANGE ADDR
  //   value: CHANGE,
  // });

  // console.log("\n RAW UNSIGNED TX:",psbt.toHex());
  // return;


  // let h = await client.blockchain_transaction_get("cb5f77f8635344177547b6dacfe97ca9610c0ba1f5e5367f7cc05e73caa14720", true)
  // console.log(h);
  // let sum=0;
  // UTXOs.forEach(utxo => {
  //   sum+=utxo.value;
  // });
  // let balance = sum/100000000;
  // console.log("Balance:", balance+" BTC");
  
  // let valueToTransfer = 0.5;
  
  // if(balance <= valueToTransfer)
  //   console.log("no enough balance");

    /*
      El que recibe
      addr: mhRfJedK4eURxELfdFMhB4WT5u4PBcVdeG
      pub: 032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2
    */
    // let recv = "032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2";
    // let recvAddr = "mhRfJedK4eURxELfdFMhB4WT5u4PBcVdeG";
    // let buf = Buffer.from(recv, 'hex');

  // let p2pkhRecv = bitcoinjs.payments.p2pkh({pubkey: buf, network});
  
  // let txb = new bitcoinjs.TransactionBuilder(network);

  // txb.addInput(UTXOs[1].tx_hash, UTXOs[1].tx_pos);
  // txb.addInput(UTXOs[2].tx_hash, UTXOs[2].tx_pos);

  // txb.addOutput(recvAddr, TARGET);
  // txb.addOutput(_AMI, CHANGE);

  /*
     bitcoin.ECPair.fromWIF(bob[0].wif, network)
  */

  // let asd = {
  //   pubkey: "032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2",
  //   privkey: "cMfh2e21Q75h9Nx2w5ifkS1nRNxDgZLLzK4ZYhuiG5GsjP9Jrnjd"
  // }

  // const keyPair = bitcoinjs.ECPair.fromWIF(
  //   'cMfh2e21Q75h9Nx2w5ifkS1nRNxDgZLLzK4ZYhuiG5GsjP9Jrnjd',
  //   network
  // );
  
  // txb.sign(0, keyPair);
  // const tx = txb.build()
  // console.log('tx.toHex()  ', tx.toHex())


  /*
    tx:
      0200000001144e246d85a1031ab84dfcf59e24dbd4f331a5b9b85c50d3cd14ddf8549e561b010000006a473044022012d937f62299016b5560ebaf9989d50f8a36b79c858bf77c4e888a04b7c4842702202f1c7a98b5ae204758ff28419045c3e1dc0488d0dc93b8344db48ce2ba352144012103f6a3260bbd1f48b93fb750a98f0d81ade38daff9597a5323e023bed861feb12fffffffff0120300500000000001976a91414effd4c375b9667c5c9443e487641d62ba9839688ac00000000
  */
  

//  let res = await client.blockchain_transaction_broadcast(tx.toHex());
//  console.log(res);


})()
