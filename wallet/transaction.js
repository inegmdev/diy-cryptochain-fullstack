const { v4: uuidv4 } = require('uuid');
const { verifySignature } = require('../util');

class Transaction {
  constructor({ senderWallet, recipient, amount }) {

    if (amount > senderWallet.balance) {
      throw new Error('Amount exceeds balance.');
    }

    this.id = uuidv4();
    this.outputMap = this.createOutputMap({ senderWallet, recipient, amount });
    this.input = this.createInputMap({ senderWallet, outputMap: this.outputMap });
  }

  /** Helper method  */
  createOutputMap({ senderWallet, recipient, amount }) {
    const outputMap = {};
    outputMap[recipient] = amount;
    outputMap[senderWallet.publicKey] = senderWallet.balance - amount;
    return outputMap;
  }

  /** Helper function */
  createInputMap({ senderWallet, outputMap }) {
    return {
      timestamp: Date.now(),
      amount: senderWallet.balance,
      address: senderWallet.publicKey,
      signature: senderWallet.sign(outputMap)
    };
  }

  update({ senderWallet, recipient, amount }) {
    const { publicKey } = senderWallet;
    const senderBalance = this.outputMap[publicKey];

    if (amount > senderBalance) {
      throw new Error('Amount exceeds balance.');
    }
    // Assign the amount to the recipient and subtract it from the sender remaining balance
    this.outputMap[recipient] = amount
    this.outputMap[publicKey] -= amount;
    this.input =  this.createInputMap({ senderWallet, outputMap: this.outputMap });
  }

  static validate(transaction) {
    const { input : { address, amount, signature } , outputMap } = transaction;

    // Check if amount in == amout out
    const outputTotal = Object.values(outputMap)
      .reduce((total, outputAmount) => total + outputAmount);
    if(amount !== outputTotal) {
      console.error(`[ERROR] Invalid transaction from ${address}, amounts not add up.`);
      return false;
    }
    
    // Check the signature
    if( verifySignature({ publicKey: address, data: outputMap, signature }) === false ) {
      console.error(`[ERROR] Invalid transaction from ${address}, wrong signature.`);
      return false;
    }

    return true;
  }
}

module.exports = Transaction;