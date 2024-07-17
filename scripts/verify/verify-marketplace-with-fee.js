const hre = require("hardhat");

const name = "Marketplace";
const version = "4";
const feeInBeeps = 10000;

async function main() {
  await hre.run("verify:verify", {
    address: process.env.MARKET_WITH_FEE,
    contract:
      "contracts/marketplace/presets/MarketplacePresetWithFee.sol:MarketplacePresetWithFee",
    constructorArguments: [feeInBeeps, name, version],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
