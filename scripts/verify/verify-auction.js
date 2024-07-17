const hre = require("hardhat");

async function main() {
  await hre.run("verify:verify", {
    address: process.env.AUCTION,
    constructorArguments: [],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
