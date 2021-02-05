const ElectrumClient = require('@codewarriorr/electrum-client-js');
const bitcoinjs = require('bitcoinjs-lib');
const coinSelect = require('coinselect')

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

(async function(){

  
  let client = await connect();

  network = bitcoinjs.networks.testnet;
  
  const script = bitcoinjs.address.toOutputScript("n2CXXfYf7hJJHoqwjhLaj7LTWGM1q4jaFs", network);
  const hash = bitcoinjs.crypto.sha256(script);
  const reversedHash = new Buffer.from(hash.reverse());
  const rScriptHash = reversedHash.toString('hex');

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

  */
  
  try {
    let feeRate = 55 // satoshis per byte
  
  log = console.log;
  
  const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);
  //const RAW_HEX_TX = await client.blockchain_transaction_get(UTXOs[0].tx_hash);
  
  let finalUTXOs = [];
  let RAW_HEX_TX_0 = Buffer.from(await client.blockchain_transaction_get(UTXOs[0].tx_hash), 'hex');
  let RAW_HEX_TX_1 = Buffer.from(await client.blockchain_transaction_get(UTXOs[1].tx_hash), 'hex');

  let tempUTXOs =  [];

  UTXOs.forEach(utxo => {
    
    tempUTXOs.push({
      txId: utxo.tx_hash,
      vout: utxo.tx_pos,
      value: utxo.value,
      // For use with PSBT:
      // not needed for coinSelect, but will be passed on to inputs later
      //nonWitnessUtxo: Buffer.from(RAW_HEX_TX, 'hex'),
    })
  });

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
  

  //log(inputs, outputs, fee);


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
