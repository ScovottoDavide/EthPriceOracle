const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-toolbox/network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
const { ethers } = require("hardhat");
const { getBytes, toUtf8Bytes, fromTwos } = require("ethers");
  
  describe("EthPriceOracle", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployEthPriceOracle() {
      // Contracts are deployed using the first signer/account by default
      const [owner, otherAccount] = await ethers.getSigners();
  
      const EthPriceOracle = await ethers.getContractFactory("EthPriceOracle");
      const ethPriceOracle = await EthPriceOracle.deploy(owner);
  
      return { ethPriceOracle, owner, otherAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner upon deployment", async function () {
            const { ethPriceOracle, owner } = await loadFixture(deployEthPriceOracle);
            const OWNER_ROLE = ethers.keccak256(toUtf8Bytes("OWNER_ROLE"));
            expect(await ethPriceOracle.hasRole(OWNER_ROLE, owner)).to.be.true;
        });
    })

    describe("Add and remove oracles", function () {
        it("Should NOT break RBAC", async function () {
            const { ethPriceOracle, owner, otherAccount } = await loadFixture(deployEthPriceOracle);
            // calling addOracle with a NON owner address. Hence should revert
            await expect(ethPriceOracle.connect(otherAccount).addOracle(owner.address))
            .to
            .be
            .revertedWithCustomError(ethPriceOracle, "AccessControlUnauthorizedAccount")
        })

        it("Should Add and remove oracles", async function () {
            const { ethPriceOracle, owner, otherAccount } = await loadFixture(deployEthPriceOracle);
            const ORACLE_ROLE = ethers.keccak256(toUtf8Bytes("ORACLE_ROLE"));
            
            // add 2 oracles
            expect(await ethPriceOracle.addOracle(owner.address))
                .to
                .emit(ethPriceOracle, "AddOracleEvent")
                .withArgs(owner.address);
            expect(await ethPriceOracle.addOracle(otherAccount.address))
                .to
                .emit(ethPriceOracle, "AddOracleEvent")
                .withArgs(otherAccount.address);

            expect(await ethPriceOracle.hasRole(ORACLE_ROLE, owner.address)).to.be.true;
            expect(await ethPriceOracle.hasRole(ORACLE_ROLE, otherAccount.address)).to.be.true;
            
            // remove 1 oracle should be fine
            expect(await ethPriceOracle.removeOracle(owner))
            .to
            .emit(ethPriceOracle, "RoleRevoked")
            .withArgs(ORACLE_ROLE, owner.address, owner);
            expect(await ethPriceOracle.hasRole(ORACLE_ROLE, owner.address)).to.be.false;
            
            // should NOT be able to remove last oracle
            await expect(ethPriceOracle.removeOracle(otherAccount.address))
            .to
            .be
            .revertedWith("Do not remove the last oracle!")

            expect(await ethPriceOracle.hasRole(ORACLE_ROLE, otherAccount.address)).to.be.true;
        });
    })

    
})