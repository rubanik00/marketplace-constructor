const hre = require("hardhat");

const name = "Marketplace";
const version = "1";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.MARKET_WITHOUT_FEE,
    constructorArguments: [name, version],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
