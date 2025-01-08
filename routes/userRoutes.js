const express = require("express");
const db = require("../database/db");
const { ethers } = require("ethers");
const { encrypt, decrypt } = require("../utils/crypto");
const router = express.Router();

// Register a user
router.post("/register", async (req, res) => {
  const { nationalID } = req.body;

  try {
    // Generate wallet
    const wallet = ethers.Wallet.createRandom();
    const walletAddress = wallet.address;
    const encryptedPrivateKey = encrypt(wallet.privateKey);

    const query = `INSERT INTO users (nationalID, walletAddress, encryptedPrivateKey) VALUES (?, ?, ?)`;
    db.query(
      query,
      [nationalID, walletAddress, JSON.stringify(encryptedPrivateKey)],
      (err, result) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY") {
            return res
              .status(400)
              .send({ error: "National ID already registered" });
          }
          return res
            .status(500)
            .send({ error: "Database error", details: err });
        }
        res.send({ message: "User registered successfully", walletAddress });
      }
    );
  } catch (err) {
    res
      .status(500)
      .send({ error: "Error generating wallet", details: err.message });
  }
});

// Retrieve user info by National ID
router.get("/:nationalID", (req, res) => {
  const { nationalID } = req.params;

  const query = `SELECT nationalID, walletAddress FROM users WHERE nationalID = ?`;
  db.query(query, [nationalID], (err, results) => {
    if (err) {
      return res.status(500).send({ error: "Database error", details: err });
    }
    if (results.length === 0) {
      return res.status(404).send({ error: "User not found" });
    }
    res.send(results[0]);
  });
});

module.exports = router;
