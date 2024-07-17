const hre = require("hardhat");

const collectionsWithSignatureName = "CollectionsWithSignature";
const collectionsVersion = "1";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.COLLECTIONS_CONTRACT,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: process.env.COLLECTIONS_WITH_SIGN_CONTRACT,
    constructorArguments: [collectionsWithSignatureName, collectionsVersion],
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
