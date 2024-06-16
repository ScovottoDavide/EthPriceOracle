const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("OracleContract", (m) => {
  const token = m.contract("EthPriceOracle");

  return { token };
});