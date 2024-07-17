const { ethers, upgrades } = require("hardhat");

const collectionsWithSignatureName = "CollectionsWithSignature";
const collectionsVersion = "1";

async function main() {
  const CollectionsPresetUpgradeable = await ethers.getContractFactory(
    "CollectionsPresetUpgradeable"
  );
  const collectionsUpgradeable = await upgrades.deployProxy(
    CollectionsPresetUpgradeable,
    [],
    { initializer: "initialize" }
  );

  const CollectionsPresetWithSignatureUpgradeable =
    await ethers.getContractFactory(
      "CollectionsPresetWithSignatureUpgradeable"
    );
  const collectionsWithSignatureUpgradeable = await upgrades.deployProxy(
    CollectionsPresetWithSignatureUpgradeable,
    [collectionsWithSignatureName, collectionsVersion],
    { initializer: "initialize" }
  );

  console.log("collectionsUpgradeable: ", collectionsUpgradeable.address);
  console.log(
    "collectionsWithSignatureUpgradeable: ",
    collectionsWithSignatureUpgradeable.address
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
