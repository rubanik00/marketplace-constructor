const hre = require("hardhat");

async function main() {
  const Multicall = await hre.ethers.getContractFactory("Multicall");
  const multicall = await Multicall.deploy();
  await multicall.deployed();
  console.log("Multicall: ", multicall.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
