const express = require("express");
const db = require("../database/db");
const { ethers } = require("ethers");
const { encrypt, decrypt } = require("../utils/crypto");
const router = express.Router();

// Register a user
router.post("/register", async (req, res) => {
  console.log("registering user");
  console.log("req.body : ", req.body);
  const { nationalID } = req.body;

  console.log("full Name :", req.body.fullName);
  const { fullName } = req.body;
  console.log("national id number", nationalID);

  try {
    // Generate wallet
    console.log("====start generating unique with :====== ");
    const wallet = ethers.Wallet.createRandom();

    console.log("wallet generated", wallet);
    const walletAddress = wallet.address;

    // Encrypt private key
    console.log("++++wallet private key :++++", wallet.privateKey);
    //const encryptedPrivateKey = encrypt(wallet.privateKey);
    const encryptedPrivateKey = wallet.privateKey;

    // Save user to database
    console.log("encryptedPrivateKey", encryptedPrivateKey);

    // Insert to database
    console.log("===start inserting to database===");
    const query = `INSERT INTO users (nationalID, fullName, walletAddress, encryptedPrivateKey, nationalIdStatus) VALUES (?, ?, ?,?,?)`;

    db.query(
      query,
      [
        nationalID,
        fullName,
        walletAddress,
        JSON.stringify(encryptedPrivateKey),
        "pending",
      ],
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

  const query = `SELECT * FROM users WHERE nationalID = ?`;
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
