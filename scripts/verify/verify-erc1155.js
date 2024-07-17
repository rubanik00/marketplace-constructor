const hre = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "stageToken1155";
const tokenVersion = "1";
const tokenSymbol = "TEST1155";
const fee = "1000";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.ERC1155,
    constructorArguments: [
      tokenName,
      tokenSymbol,
      tokenVersion,
      tokenUri,
      process.env.SIGNER,
      fee,
    ],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
