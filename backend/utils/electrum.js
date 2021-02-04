const ElectrumClient = require('@codewarriorr/electrum-client-js');
const bitcoinjs = require('bitcoinjs-lib');
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
  
  const script = bitcoinjs.address.toOutputScript("mnqpyF88ZCmQcWbHXWKatYzfhMRW8gJqVD", network);
  const hash = bitcoinjs.crypto.sha256(script);
  const reversedHash = new Buffer.from(hash.reverse());
  const rScriptHash = reversedHash.toString('hex');
  
  

  const UTXOs = await client.blockchain_scripthash_listunspent(rScriptHash);
  
  console.log(UTXOs);

  // let h = await client.blockchain_transaction_get("cb5f77f8635344177547b6dacfe97ca9610c0ba1f5e5367f7cc05e73caa14720", true)
  // console.log(h);
  let sum=0;
  UTXOs.forEach(utxo => {
    sum+=utxo.value;
  });
  let balance = sum/100000000;
  console.log("Balance:", balance+" BTC");
  
  let valueToTransfer = 0.5;
  
  // if(balance <= valueToTransfer)
  //   console.log("no enough balance");

    /*
      El que recibe
      addr: mhRfJedK4eURxELfdFMhB4WT5u4PBcVdeG
      pub: 032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2
    */
    let recv = "032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2";
    let recvAddr = "mhRfJedK4eURxELfdFMhB4WT5u4PBcVdeG";
    let buf = Buffer.from(recv, 'hex');

  let p2pkhRecv = bitcoinjs.payments.p2pkh({pubkey: buf, network});
  
  let txb = new bitcoinjs.TransactionBuilder(network);

  txb.addInput(UTXOs[1].tx_hash, UTXOs[1].tx_pos);
  txb.addOutput(recvAddr, 340000);

  /*
     bitcoin.ECPair.fromWIF(bob[0].wif, network)
  */

  // let asd = {
  //   pubkey: "032c86c6c2656fe28dcfe7cc2ce7d75d57cfd5fee954496b6c621a7fcf652ffbd2",
  //   privkey: "cMfh2e21Q75h9Nx2w5ifkS1nRNxDgZLLzK4ZYhuiG5GsjP9Jrnjd"
  // }

  const keyPair = bitcoinjs.ECPair.fromWIF(
    'cMfh2e21Q75h9Nx2w5ifkS1nRNxDgZLLzK4ZYhuiG5GsjP9Jrnjd',
    network
  );
  
  txb.sign(0, keyPair);
  const tx = txb.build()
  console.log('tx.toHex()  ', tx.toHex())
  /*
    tx:
      0200000001144e246d85a1031ab84dfcf59e24dbd4f331a5b9b85c50d3cd14ddf8549e561b010000006a473044022012d937f62299016b5560ebaf9989d50f8a36b79c858bf77c4e888a04b7c4842702202f1c7a98b5ae204758ff28419045c3e1dc0488d0dc93b8344db48ce2ba352144012103f6a3260bbd1f48b93fb750a98f0d81ade38daff9597a5323e023bed861feb12fffffffff0120300500000000001976a91414effd4c375b9667c5c9443e487641d62ba9839688ac00000000
  */
  

//  let res = await client.blockchain_transaction_broadcast(tx.toHex());
//  console.log(res);


})()
