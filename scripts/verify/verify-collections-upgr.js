const hre = require("hardhat");

const collectionsWithSignatureName = "CollectionsWithSignature";
const collectionsVersion = "1";

async function main() {
  await hre.run("verify:verify", {
    address: process.env.COLLECTIONS_UPGR_CONTRACT,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: process.env.COLLECTIONS_UPGR_WITH_SIGN_CONTRACT,
    constructorArguments: [collectionsWithSignatureName, collectionsVersion],
  });
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
