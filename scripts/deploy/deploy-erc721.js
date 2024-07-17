const hre = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const fee = "1000";

async function main() {
  const Contract = await ethers.getContractFactory(
    "ERC721PresetMintableRoyaltyURI"
  );
  token = await Contract.deploy(
    tokenName,
    tokenSymbol,
    tokenVersion,
    fee,
    tokenUri
  );
  await token.deployed();

  console.log("ERC721PresetMintableRoyaltyURI: ", token.address);

  const Contract2 = await ethers.getContractFactory("ERC721PresetMintableURI");
  token2 = await Contract2.deploy(
    tokenName,
    tokenSymbol,
    tokenVersion,
    tokenUri
  );
  await token2.deployed();

  console.log("ERC721PresetMintableURI: ", token2.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
