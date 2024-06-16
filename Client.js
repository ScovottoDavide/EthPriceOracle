const { ethers } = require('hardhat');
const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './caller_private_key'

const callerAddress =  "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"
const oracleAddress =  "0x8464135c8F25Da09e49BC8782676a84730C318bC"


async function getCallerContract () {
  return await ethers.getContractAt("CallerContract", callerAddress);
}

async function filterEvents (callerContract) {
  callerContract.on("PriceUpdatedEvent", async (err, event) => {
    if (err) console.error('Error on event', err)
    console.log(event)
    console.log('* New PriceUpdated event. ethPrice: ' + event.returnValues.ethPrice)
  })
  callerContract.on("ReceivedNewRequestIdEvent", async (err, event) => {
    if (err) console.error('Error on event', err)
  })
}

async function init () {
  const account = common.loadAccount(PRIVATE_KEY_FILE_NAME)
  const callerContract = await getCallerContract()
  filterEvents(callerContract)
  return { callerContract, account }
}

(async () => {
  const { callerContract, account } = await init()
  process.on( 'SIGINT', () => {
    console.log('Disconnecting Callers client')
    process.exit( );
  })
  await callerContract.setOracleInstanceAddress(oracleAddress, {from: account.address})
  setInterval( async () => {
    await callerContract.updateEthPrice({from: account.address}) 
  }, SLEEP_INTERVAL);
})()
