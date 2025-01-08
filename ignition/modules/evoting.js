const fs = require("fs");
const path = require("path");
const ethers = require("ethers");

const LOCAL_RPC_URL = "http://127.0.0.1:8545";
const DEPLOYER_PRIVATE_KEY =
  "ac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
  console.log("============Starting deployment script...=====");
  const outputDir = path.resolve(__dirname, "../../config/");
  const ensureDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  };
  ensureDirExists(outputDir);

  const provider = new ethers.providers.JsonRpcProvider(LOCAL_RPC_URL);
  const wallet = new ethers.Wallet(DEPLOYER_PRIVATE_KEY, provider);
  console.log("Deployer account address:", wallet.address);

  // Helper function to save contract data
  const saveContractData = (name, address, abi) => {
    fs.writeFileSync(
      path.join(outputDir, `${name}_address.json`),
      JSON.stringify({ address }, null, 2),
      "utf-8"
    );
    fs.writeFileSync(
      path.join(outputDir, `${name}_abi.json`),
      JSON.stringify(abi, null, 2),
      "utf-8"
    );
    console.log(`${name} deployed and data saved.`);
  };

  console.log("Deploying Evoting contract ...");
  const EVotingArtifact = require("../artifacts/contracts/EVoting.sol/EVoting.json");
  const EVotingFactory = new ethers.ContractFactory(
    EVotingArtifact.abi,
    EVotingArtifact.bytecode,
    wallet
  );

  // Deploy the contract
  const evoting = await EVotingFactory.deploy();

  // Wait for the transaction to be mined
  await evoting.deployTransaction.wait();

  // Save the contract data
  saveContractData("EVoting", evoting.address, EVotingArtifact.abi);

  console.log("EVoting contract deployed to:", evoting.address);
  console.log("===========end of deployment script===========");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
