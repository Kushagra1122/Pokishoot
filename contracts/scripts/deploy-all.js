const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await hre.ethers.provider.getBalance(deployer.address)).toString());

  const network = hre.network.name;
  const isTestnet = network === "moonbase";

  // Deploy PokemonNFT (if not already deployed)
  let pokemonNFTAddress = process.env.NFT_CONTRACT_ADDRESS;
  if (!pokemonNFTAddress) {
    console.log("\n📦 Deploying PokemonNFT...");
    const PokemonNFT = await hre.ethers.getContractFactory("PokemonNFT");
    const pokemonNFT = await PokemonNFT.deploy();
    await pokemonNFT.waitForDeployment();
    pokemonNFTAddress = await pokemonNFT.getAddress();
    console.log("✅ PokemonNFT deployed to:", pokemonNFTAddress);
  } else {
    console.log("✅ Using existing PokemonNFT at:", pokemonNFTAddress);
  }

  // Deploy Marketplace
  console.log("\n📦 Deploying Marketplace...");
  const Marketplace = await hre.ethers.getContractFactory("Marketplace");
  const feeRecipient = deployer.address; // Can be changed to DAO treasury later
  const marketplace = await Marketplace.deploy(pokemonNFTAddress, feeRecipient);
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ Marketplace deployed to:", marketplaceAddress);

  // Deploy Leaderboard
  console.log("\n📦 Deploying Leaderboard...");
  const Leaderboard = await hre.ethers.getContractFactory("Leaderboard");
  const leaderboard = await Leaderboard.deploy();
  await leaderboard.waitForDeployment();
  const leaderboardAddress = await leaderboard.getAddress();
  console.log("✅ Leaderboard deployed to:", leaderboardAddress);

  // Deploy GovernanceToken
  console.log("\n📦 Deploying GovernanceToken...");
  const GovernanceToken = await hre.ethers.getContractFactory("GovernanceToken");
  const communityTreasury = deployer.address; // Should be a multisig in production
  const liquidityPool = deployer.address; // Should be a DEX pool
  const rewardsPool = deployer.address; // Should be a rewards contract
  const teamWallet = deployer.address; // Team wallet
  
  const governanceToken = await GovernanceToken.deploy(
    communityTreasury,
    liquidityPool,
    rewardsPool,
    teamWallet
  );
  await governanceToken.waitForDeployment();
  const governanceTokenAddress = await governanceToken.getAddress();
  console.log("✅ GovernanceToken deployed to:", governanceTokenAddress);

  // Save deployment addresses
  const deploymentDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }

  const deploymentFile = path.join(
    deploymentDir,
    `${network}-all-deployment.json`
  );

  const deployment = {
    network,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    contracts: {
      PokemonNFT: pokemonNFTAddress,
      Marketplace: marketplaceAddress,
      Leaderboard: leaderboardAddress,
      GovernanceToken: governanceTokenAddress,
    },
  };

  fs.writeFileSync(deploymentFile, JSON.stringify(deployment, null, 2));
  console.log("\n✅ Deployment info saved to:", deploymentFile);

  // Save individual deployment files for backward compatibility
  fs.writeFileSync(
    path.join(deploymentDir, `marketplace-${network}-deployment.json`),
    JSON.stringify({
      contractAddress: marketplaceAddress,
      network,
      deployedAt: new Date().toISOString(),
    }, null, 2)
  );

  fs.writeFileSync(
    path.join(deploymentDir, `leaderboard-${network}-deployment.json`),
    JSON.stringify({
      contractAddress: leaderboardAddress,
      network,
      deployedAt: new Date().toISOString(),
    }, null, 2)
  );

  console.log("\n🎉 All contracts deployed successfully!");
  console.log("\n📋 Contract Addresses:");
  console.log("  PokemonNFT:", pokemonNFTAddress);
  console.log("  Marketplace:", marketplaceAddress);
  console.log("  Leaderboard:", leaderboardAddress);
  console.log("  GovernanceToken:", governanceTokenAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

