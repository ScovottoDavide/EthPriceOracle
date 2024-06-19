const axios = require('axios')
const { ethers } = require('hardhat');
const BN = require('bn.js')
const common = require('./utils/common.js')
const SLEEP_INTERVAL = process.env.SLEEP_INTERVAL || 2000
const PRIVATE_KEY_FILE_NAME = process.env.PRIVATE_KEY_FILE || './oracle_private_key'
const CHUNK_SIZE = process.env.CHUNK_SIZE || 3
const MAX_RETRIES = process.env.MAX_RETRIES || 5
var pendingRequests = []

const oracleAddress =  "0x5fbdb2315678afecb367f032d93f642f64180aa3"


async function getOracleContract () {
  return await ethers.getContractAt("EthPriceOracle", oracleAddress);
}

async function retrieveLatestEthPrice () {
    const resp = await axios({
      url: 'https://api.binance.com/api/v3/ticker/price',
      params: {
        symbol: 'ETHUSDT'
      },
      method: 'get'
    })
    return resp.data.price
  }

async function filterEvents (oracleContract) {
    oracleContract.on("GetLatestEthPriceEvent", async (err, event) => {
      if (err) {
        console.error('Error on event', err)
        return
      }
      await addRequestToQueue(event)
    })
  
    oracleContract.on("SetLatestEthPriceEvent", async (err, event) => {
      if (err) {
        console.error('Error on event', err)
        return
      }
      // Do something
    })
  }

  async function addRequestToQueue (event) {
    const callerAddress = event.returnValues.callerAddress
    const id = event.returnValues.id
    pendingRequests.push({callerAddress, id})
}

// JavaScript is single-threaded. This means that all other operations would be blocked until the processing is finished.
// A technique to solve this problem is to break the array into smaller chunks (up to MAX_CHUNK_SIZE), and process these chunks individually
async function processQueue (oracleContract, ownerAddress) {
    let processedRequests = 0
    while (pendingRequests.length > 0 && processedRequests < CHUNK_SIZE) {
      const req = pendingRequests.shift() // returns the first element of the array, removes the element from the array, and changes the length of the array
      await processRequest(oracleContract, ownerAddress, req.id, req.callerAddress)
      processedRequests++
    }
}


async function processRequest (oracleContract, ownerAddress, id, callerAddress) {
    let retries = 0
    while (retries < MAX_RETRIES) {
      try {
        // Start here
        const ethPrice = await retrieveLatestEthPrice()
        await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, ethPrice, id)
        return
      } catch (error) {
        if(retries === MAX_RETRIES - 1) {
            // retries finished. Set ethPrice to 0 on OracleContract.
            await setLatestEthPrice(oracleContract, callerAddress, ownerAddress, '0', id)
            return
        }
        retries++
      }
    }
  }

  async function setLatestEthPrice (oracleContract, callerAddress, ownerAddress, ethPrice, id) {
    ethPrice = ethPrice.replace('.', '')
    const multiplier = new BN(10**10, 10)
    const ethPriceInt = (new BN(parseInt(ethPrice), 10)).mul(multiplier)
    const idInt = new BN(parseInt(id))
    try {
      await oracleContract.methods.setLatestEthPrice(ethPriceInt.toString(), callerAddress, idInt.toString()).send({ from: ownerAddress })
    } catch (error) {
      console.log('Error encountered while calling setLatestEthPrice.')
      // Do some error handling
    }
  }

  async function init () {
    // Start here
    const account = common.loadAccount(PRIVATE_KEY_FILE_NAME)
    const oracleContract = await getOracleContract()
    await filterEvents(oracleContract)
    return {oracleContract, account}
  }

  (async () => {
    const { oracleContract, account } = await init()
    process.on( 'SIGINT', () => {
      console.log('Disconnecting Oracle client')
      process.exit( )
    })
    setInterval(async () => {
      await processQueue(oracleContract, account)
    }, SLEEP_INTERVAL)
  })()
  
  