require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-collections-upgr --name CollectionsWithSignature --ver 1 --env develop --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  env - contract environment (stage OR develop);
*/
task("deploy-collections-upgr")
  .addParam("name")
  .addParam("ver")
  .addParam("env")
  .setAction(async ({ name, ver, env }) => {
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
      [name, ver],
      { initializer: "initialize" }
    );

    console.log("collectionsUpgradeable: ", collectionsUpgradeable.address);
    console.log(
      "collectionsWithSignatureUpgradeable: ",
      collectionsWithSignatureUpgradeable.address
    );

    //// Save contract data to DB
    save(
      "CollectionsPresetUpgradeable",
      collectionsUpgradeable,
      "zero",
      env,
      ver
    );
    save(
      "CollectionsPresetWithSignatureUpgradeable",
      collectionsWithSignatureUpgradeable,
      name,
      env,
      ver
    );
  });
