const hre = require("hardhat");

const tokenName = "testTokenName";
const symbol = "TEST";
const initialSupply = "10000000000000000000";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.ERC20,
    constructorArguments: [initialSupply, tokenName, symbol],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
