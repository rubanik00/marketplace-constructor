const hre = require("hardhat");

const MULTICALL_ADDRESS = process.env.MULTICALL;

async function main() {
  const AUCTION = hre.ethers.utils.id("OWNER_AUCTION_ROLE");

  const Auction = await ethers.getContractFactory("Auction");
  const auction = await Auction.deploy();
  await auction.deployed();
  let tx = await auction.init();
  await tx.wait();

  tx = await auction.grantRole(AUCTION, MULTICALL_ADDRESS);
  await tx.wait();

  console.log("Auction: ", auction.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
