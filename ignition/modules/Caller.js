const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("CallerContract", (m) => {
  const token = m.contract("CallerContract");

  return { token };
});