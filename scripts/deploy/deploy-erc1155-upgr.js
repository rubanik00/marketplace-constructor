const { ethers, upgrades } = require("hardhat");

const tokenUri = process.env.BASE_URI;
const tokenName = "testNameToken";
const tokenVersion = "1";
const tokenSymbol = "testSymbolToken";
const fee = "1000";

async function main() {
  const Token = await ethers.getContractFactory(
    "ERC1155PresetMintableRoyaltyUpgradeable"
  );

  const token = await upgrades.deployProxy(
    Token,
    [tokenName, tokenSymbol, tokenVersion, tokenUri, process.env.SIGNER, fee],
    { initializer: "initialize" }
  );
  console.log("ERC1155PresetMintableRoyaltyUpgradeable: ", token.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
