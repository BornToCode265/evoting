require("dotenv").config();
const express = require("express");
const { ethers } = require("ethers");
const bodyParser = require("body-parser");

const contractData = require("../config/EVoting_abi.json");
const contractAddress = require("../config/EVoting_address.json").address;

// Load environment variables

const ADMIN_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const router = express.Router();
const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:8545");

router.use(bodyParser.json());

// Setup blockchain connection

const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  contractAddress,
  contractData,
  adminWallet
);

// API endpoints
/**
 * @route POST /create-election
 * @desc Create a new election
 * @body { name: string, candidates: string[], startTime: number, endTime: number }
 */
router.post("/create-election", async (req, res) => {
  console.log("create-election");
  try {
    const { name, candidates, startTime, endTime } = req.body;

    const tx = await contract.createElection(
      name,
      candidates,
      startTime,
      endTime
    );
    await tx.wait();

    res.json({
      message: "Election created successfully",
      transactionHash: tx.hash,
    });
  } catch (error) {
    console.error("Error creating election:", error);
    res
      .status(500)
      .json({ error: "Failed to create election", details: error.message });
  }
});

/**
 * @route GET /listen-events
 * @desc Listen for all contract events in real time
 */
router.get("/listen-events", async (req, res) => {
  try {
    contract.on("*", (event) => {
      console.log("Event emitted:", event);
    });

    res.json({ message: "Listening to contract events in real-time" });
  } catch (error) {
    console.error("Error setting up event listener:", error);
    res.status(500).json({
      error: "Failed to set up event listener",
      details: error.message,
    });
  }
});

/**
 * @route GET /get-candidates/:electionId
 * @desc Get candidates for a specific election
 * @param {number} electionId
 */
router.get("/get-candidates/:electionId", async (req, res) => {
  try {
    const electionId = parseInt(req.params.electionId, 10); // Convert electionId to a number
    const candidates = await contract.getCandidates(electionId.toString());

    res.json({ electionId, candidates });
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch candidates", details: error.message });
  }
});

/**
 * @route POST /end-election/:electionId
 * @desc End an election and announce the winner
 * @param {number} electionId
 */
router.post("/end-election/:electionId", async (req, res) => {
  try {
    const electionId = req.params.electionId;
    const tx = await contract.endElection(electionId);
    await tx.wait();

    res.json({
      message: "Election ended successfully",
      transactionHash: tx.hash,
    });
  } catch (error) {
    console.error("Error ending election:", error);
    res
      .status(500)
      .json({ error: "Failed to end election", details: error.message });
  }
});

module.exports = router;
