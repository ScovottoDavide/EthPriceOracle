const { ethers } = require("hardhat");
const common = require('../utils/common.js')
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller_private_key'

async function main() {
    const {account} = common.loadAccount(PRIVATE_KEY_FILE_NAME)
    const oracleAddress = ''

    const CallerContract = await ethers.getContractFactory("CallerContract", account);
    const callerContractToken = await CallerContract.deploy();
    console.log(callerContractToken.address)

    // add factory and exchange address to router
    const box = CallerContract.attach(callerContractToken.address);
    await box.setOracleInstanceAddress(oracleAddress);
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});