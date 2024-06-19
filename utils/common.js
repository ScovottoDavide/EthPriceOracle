const fs = require('fs');
const { ethers } = require('hardhat');

function loadAccount (privateKeyFileName) {
  const provider = new ethers.JsonRpcProvider('http://localhost:8545')
  const privateKeyStr = fs.readFileSync(privateKeyFileName, 'utf-8')
  const account = new ethers.Wallet(
      privateKeyStr,
      provider
  ); 
  console.log('Loaded account: ', account)  
  return {
    account: account
  }
}

module.exports = {
  loadAccount,
};
