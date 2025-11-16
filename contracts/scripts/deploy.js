const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying PokemonNFT contract...");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  // Get account balance
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "GLMR/DEV");

  // Deploy the contract
  const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
  const pokemonNFT = await PokemonNFT.deploy();

  await pokemonNFT.waitForDeployment();
  const contractAddress = await pokemonNFT.getAddress();

  console.log("✅ PokemonNFT deployed to:", contractAddress);
  console.log("🌐 Network:", hre.network.name);
  console.log("🔗 Chain ID:", (await hre.ethers.provider.getNetwork()).chainId);

  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    chainId: (await hre.network.config).chainId || (await hre.ethers.provider.getNetwork()).chainId,
    contractAddress: contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    blockNumber: await hre.ethers.provider.getBlockNumber(),
  };

  // Write to deployment file
  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentsDir,
    `${hre.network.name}-deployment.json`
  );

  fs.writeFileSync(
    deploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info saved to:", deploymentFile);

  // Also save to server directory for easy access
  const serverDeploymentFile = path.join(
    __dirname,
    "../../server/deployments",
    `${hre.network.name}-deployment.json`
  );

  const serverDeploymentsDir = path.dirname(serverDeploymentFile);
  if (!fs.existsSync(serverDeploymentsDir)) {
    fs.mkdirSync(serverDeploymentsDir, { recursive: true });
  }

  fs.writeFileSync(
    serverDeploymentFile,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info also saved to:", serverDeploymentFile);

  console.log("\n✨ Deployment complete!");
  console.log("📋 Next steps:");
  console.log("1. Add CONTRACT_ADDRESS to your .env file");
  console.log("2. Update your frontend/backend to use this address");
  console.log(`3. Contract address: ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });

