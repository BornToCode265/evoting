const { expect } = require("chai");
const { ethers } = require("hardhat");
require("dotenv").config();

const PRIVATE_KEY =
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
describe("EVoting Contract", function () {
  let eVoting;
  let deployer, voter1, voter2;

  before(async function () {
    // Use deployer account derived from private key
    const provider = ethers.getDefaultProvider("http://127.0.0.1:8545"); // Local Hardhat node
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Deploy contract
    const EVoting = await ethers.getContractFactory("EVoting", wallet);
    eVoting = await EVoting.deploy();
    await eVoting.deployed();

    // Get additional test accounts
    [_, voter1, voter2] = await ethers.getSigners();
    deployer = wallet;
  });

  describe("Deployment", function () {
    it("Should set the deployer as admin", async function () {
      expect(await eVoting.admin()).to.equal(deployer.address);
    });
  });

  describe("createElection", function () {
    it("Should allow admin to create a new election", async function () {
      const name = "Election 2025";
      const candidates = ["Alice", "Bob"];
      const startTime = Math.floor(Date.now() / 1000) + 10; // Start in 10 seconds
      const endTime = startTime + 3600; // Last for 1 hour

      await expect(
        eVoting
          .connect(deployer)
          .createElection(name, candidates, startTime, endTime)
      )
        .to.emit(eVoting, "ElectionCreated")
        .withArgs(0, name, startTime, endTime);

      const election = await eVoting.elections(0);
      expect(election.name).to.equal(name);
    });

    it("Should fail if called by non-admin", async function () {
      const name = "Invalid Election";
      const candidates = ["Alice", "Bob"];
      const startTime = Math.floor(Date.now() / 1000) + 10;
      const endTime = startTime + 3600;

      await expect(
        eVoting
          .connect(voter1)
          .createElection(name, candidates, startTime, endTime)
      ).to.be.revertedWith("Only admin can perform this action");
    });
  });

  describe("vote", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const name = "Election 2025";
      const candidates = ["Alice", "Bob"];
      startTime = Math.floor(Date.now() / 1000) + 1;
      endTime = startTime + 3600;

      await eVoting
        .connect(deployer)
        .createElection(name, candidates, startTime, endTime);
    });

    it("Should allow a voter to vote", async function () {
      await ethers.provider.send("evm_increaseTime", [2]); // Simulate time passing
      await ethers.provider.send("evm_mine");

      await expect(eVoting.connect(voter1).vote(0, "Alice"))
        .to.emit(eVoting, "VoteCast")
        .withArgs(0, voter1.address, "Alice");

      const votes = await eVoting.getVoteCount(0, "Alice");
      expect(votes).to.equal(1);
    });

    it("Should fail if voter votes twice", async function () {
      await ethers.provider.send("evm_increaseTime", [2]); // Simulate time passing
      await ethers.provider.send("evm_mine");

      await eVoting.connect(voter1).vote(0, "Alice");

      await expect(eVoting.connect(voter1).vote(0, "Alice")).to.be.revertedWith(
        "You have already voted in this election"
      );
    });
  });

  describe("endElection", function () {
    let startTime, endTime;

    beforeEach(async function () {
      const name = "Election 2025";
      const candidates = ["Alice", "Bob"];
      startTime = Math.floor(Date.now() / 1000) + 1;
      endTime = startTime + 3600;

      await eVoting
        .connect(deployer)
        .createElection(name, candidates, startTime, endTime);
    });

    it("Should allow admin to end the election", async function () {
      await ethers.provider.send("evm_increaseTime", [3601]); // Move time beyond election end
      await ethers.provider.send("evm_mine");

      await eVoting.connect(voter1).vote(0, "Alice");
      await eVoting.connect(voter2).vote(0, "Alice");

      await expect(eVoting.connect(deployer).endElection(0))
        .to.emit(eVoting, "ElectionEnded")
        .withArgs(0, "Alice");

      const election = await eVoting.elections(0);
      expect(election.isActive).to.be.false;
    });
  });
});
