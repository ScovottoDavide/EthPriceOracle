const { ethers } = require("hardhat");
const common = require('../utils/common.js')
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller_private_key'

async function main() {
    const {account} = common.loadAccount(PRIVATE_KEY_FILE_NAME)

    const CallerContract = await ethers.getContractFactory("CallerContract", account);
    const address = await CallerContract.deploy();
    console.log(address)
}

main()
.then(() => process.exit(0))
.catch((error) => {
  console.error(error);
  process.exit(1);
});