const hre = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const fee = "1000";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.ERC1155_UPGR,
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
