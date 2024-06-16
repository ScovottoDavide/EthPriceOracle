const fs = require('fs');
const { ethers } = require('hardhat');

function loadAccount (privateKeyFileName) {
  const provider = new ethers.JsonRpcProvider()
  const privateKeyStr = fs.readFileSync(privateKeyFileName, 'utf-8')
  const account = new ethers.Wallet(
      privateKeyStr,
      provider
  ); 
  
  return {
    account: account
  }
}

module.exports = {
  loadAccount,
};
