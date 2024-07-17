const hre = require("hardhat");

const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const tokenUri = process.env.BASE_URI;
const fee = "1000";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.ERC721_FEE,
    constructorArguments: [tokenName, tokenSymbol, tokenVersion, fee, tokenUri],
  });

  await hre.run("verify:verify", {
    address: process.env.ERC721_NO_FEE,
    constructorArguments: [tokenName, tokenSymbol, tokenVersion, tokenUri],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
