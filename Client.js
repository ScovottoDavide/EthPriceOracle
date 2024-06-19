const { ethers } = require('hardhat');
const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller_private_key'

const callerAddress =  "0x8464135c8F25Da09e49BC8782676a84730C318bC"
const oracleAddress =  "0x5FbDB2315678afecb367f032d93F642f64180aa3"


async function getCallerContract (signer) {
  return await ethers.getContractFactory("CallerContract", signer);
}

async function filterEvents (callerContract) {
  callerContract.on("newOracleAddressEvent", async (oracleAddressSet, event) => {
    console.log('* New newOracleAddressEvent event. oracle address: ' + oracleAddressSet)
    return
  })
  callerContract.on("ReceivedNewRequestIdEvent", async (id, event) => {
    console.log('* New ReceivedNewRequestIdEvent id: ' + BigInt(id))
  })
  callerContract.on("PriceUpdatedEvent", async (ethPrice, id, event) => {
    console.log('* New PriceUpdated event. ethPrice: ' + ethPrice + ', request_id: ' + BigInt(id))
  })
}

async function init () {
  const account = common.loadAccount(PRIVATE_KEY_FILE_NAME)
  const callerContractFactory = await getCallerContract(account.account)
  const box = callerContractFactory.attach(callerAddress)

  await filterEvents(box)
  const callerNonce = await account.account.getNonce()
  await box.setOracleInstanceAddress(oracleAddress, {nonce: callerNonce});
  return box
}

(async () => {
  const callerContract = await init()
  process.on( 'SIGINT', () => {
    console.log('Disconnecting Callers client')
    process.exit( );
  })
  // setInterval( async () => {
  //   await callerContract.updateEthPrice() 
  // }, SLEEP_INTERVAL);
  await callerContract.updateEthPrice()
})()
