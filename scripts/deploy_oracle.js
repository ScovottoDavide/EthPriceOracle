const { ethers } = require("hardhat");
const common = require('../utils/common.js')
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './oracle_private_key'

async function main() {
    const {account} = common.loadAccount(PRIVATE_KEY_FILE_NAME)
    
    const EthPriceOracle = await ethers.getContractFactory("EthPriceOracle", account);
    const address = await EthPriceOracle.deploy();
    console.log(address)
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});