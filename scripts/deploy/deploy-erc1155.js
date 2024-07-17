const hre = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const fee = "1000";

async function main() {
  const Token = await ethers.getContractFactory("ERC1155PresetMintableRoyalty");
  const token = await Token.deploy(
    tokenName,
    tokenSymbol,
    tokenVersion,
    tokenUri,
    process.env.SIGNER,
    fee
  );
  await token.deployed();

  const networkData = token.provider._network;
  console.log(networkData);
  console.log("ERC1155PresetMintableRoyalty: ", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
