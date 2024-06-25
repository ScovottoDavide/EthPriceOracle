# Simple Ethereum-USD Price Oracle

Simple Ethereum-USD price oracle that fetches the price updates from Binance.

1. Run local node and deploy contracts.
```shell
npx hardhat node
npx hardhat test

npx hardhat node

npx hardhat run ./scripts/deploy.js
```

2. Execute the clients
```shell
node ./Client.js

node ./EthPriceOracle.js
```
