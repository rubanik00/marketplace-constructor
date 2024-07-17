const { ethers, upgrades } = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const fee = "1000";

async function main() {
  const Token = await ethers.getContractFactory(
    "ERC721PresetMintableRoyaltyURIUpgradeable"
  );

  token = await upgrades.deployProxy(
    Token,
    [tokenName, tokenSymbol, tokenVersion, fee, tokenUri],
    { initializer: "initialize" }
  );

  console.log("ERC721PresetMintableURI: ", token.address);

  const Contract2 = await ethers.getContractFactory(
    "ERC721PresetMintableURIUpgradeable"
  );
  token2 = await Contract2.deploy(
    tokenName,
    tokenSymbol,
    tokenVersion,
    tokenUri
  );
  await token2.deployed();

  console.log("ERC721PresetMintableURIUpgradeable: ", token2.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
