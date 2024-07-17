const hre = require("hardhat");

const name = "Marketplace";
const version = "1";
const MULTICALL_ADDRESS = process.env.MULTICALL;

async function main() {
  const OWNER_MARKETPLACE_ROLE = hre.ethers.utils.id("OWNER_MARKETPLACE_ROLE");

  const Marketplace = await hre.ethers.getContractFactory(
    "MarketplacePresetWithoutFee"
  );
  const marketplace = await Marketplace.deploy(name, version);
  await marketplace.deployed();

  const tx = await marketplace.grantRole(
    OWNER_MARKETPLACE_ROLE,
    MULTICALL_ADDRESS
  );
  await tx.wait();

  console.log("MarketplaceWithoutFee: ", marketplace.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
