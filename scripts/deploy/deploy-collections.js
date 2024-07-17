const hre = require("hardhat");

const collectionsWithSignatureName = "CollectionsWithSignature";
const collectionsVersion = "1";

async function main() {
  const CollectionsPreset = await hre.ethers.getContractFactory(
    "CollectionsPreset"
  );
  const collections = await CollectionsPreset.deploy();

  const CollectionsPresetWithSignature = await hre.ethers.getContractFactory(
    "CollectionsPresetWithSignature"
  );
  const collectionsWithSignature = await CollectionsPresetWithSignature.deploy(
    collectionsWithSignatureName,
    collectionsVersion
  );

  console.log("Collections simple: ", collections.address);
  console.log("Collections WithSignature: ", collectionsWithSignature.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
