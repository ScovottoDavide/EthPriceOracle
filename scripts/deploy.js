const { ethers } = require("hardhat");
const fs = require('fs');

const common = require('../utils/common.js')
const ORACLE_PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './oracle_private_key'
const CALLER_PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller_private_key'

async function main() {
    const provider = new ethers.JsonRpcProvider('http://localhost:8545')
    let privateKeyStr = fs.readFileSync(ORACLE_PRIVATE_KEY_FILE_NAME, 'utf-8')
    const oracleAccount = new ethers.Wallet(
        privateKeyStr,
        provider
    ); 
    privateKeyStr = fs.readFileSync(CALLER_PRIVATE_KEY_FILE_NAME, 'utf-8')
    const callerAccount = new ethers.Wallet(
        privateKeyStr,
        provider
    );

    const EthPriceOracle = await ethers.getContractFactory("EthPriceOracle", oracleAccount);
    const Oracle = (await EthPriceOracle.deploy()).waitForDeployment();
    console.log((await Oracle).target)

    const CallerContract = await ethers.getContractFactory("CallerContract", callerAccount);
    const callerContractToken = await (await CallerContract.deploy()).waitForDeployment();
    console.log(await callerContractToken.target)

    // add factory and exchange address to router
    const box = CallerContract.attach((await callerContractToken).target);
    const callerNonce = await callerAccount.getNonce()
    await box.setOracleInstanceAddress((await Oracle).target, {from: callerAccount.address, nonce: callerNonce});

    box.on("newOracleAddressEvent", async (oracleAddressSet, event) => {
        console.log('* New newOracleAddressEvent event. oracle address: ' + oracleAddressSet)
        return
    })
    
}

main()
.then(() => console.log())
.catch((error) => {
  console.error(error);
  process.exit(1);
});