const express = require("express");
const { ethers } = require("ethers");
const contractData = require("../config/EVoting_abi.json");
const contractAddress = require("../config/EVoting_address.json").address;
const db = require("../database/db");
const { decrypt } = require("../utils/crypto");

const router = express.Router();
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");
const contract = new ethers.Contract(contractAddress, contractData, provider);

// Cast a vote
router.post("/vote", async (req, res) => {
  const { nationalID, electionId, candidate } = req.body;

  const query = `SELECT walletAddress, encryptedPrivateKey FROM users WHERE nationalID = ?`;
  db.query(query, [nationalID], async (err, results) => {
    if (err) {
      return res.status(500).send({ error: "Database error", details: err });
    }
    if (results.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }

    const { walletAddress, encryptedPrivateKey } = results[0];
    const decryptedKey = decrypt(JSON.parse(encryptedPrivateKey));
    const wallet = new ethers.Wallet(decryptedKey, provider);

    try {
      const contractWithSigner = contract.connect(wallet);
      const tx = await contractWithSigner.vote(electionId, candidate);
      await tx.wait();
      res.send({ message: "Vote cast successfully", transactionHash: tx.hash });
    } catch (err) {
      res.status(500).send({ error: "Voting failed", details: err.message });
    }
  });
});

// Get election candidates
router.get("/candidates/:electionId", async (req, res) => {
  const { electionId } = req.params;

  try {
    const candidates = await contract.getCandidates(electionId);
    res.send({ electionId, candidates });
  } catch (err) {
    res
      .status(500)
      .send({ error: "Failed to fetch candidates", details: err.message });
  }
});

module.exports = router;
