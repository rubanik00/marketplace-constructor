require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-collections--name CollectionsWithSignature --ver 1 --env develop --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  env - contract environment (stage OR develop);
*/
task("deploy-collections")
  .addParam("name")
  .addParam("ver")
  .addParam("env")
  .setAction(async ({ name, ver, env }) => {
    const CollectionsPreset = await hre.ethers.getContractFactory(
      "CollectionsPreset"
    );
    const collections = await CollectionsPreset.deploy();

    const CollectionsPresetWithSignature = await hre.ethers.getContractFactory(
      "CollectionsPresetWithSignature"
    );
    const collectionsWithSignature =
      await CollectionsPresetWithSignature.deploy(name, ver);

    console.log("Collections simple: ", collections.address);
    console.log(
      "Collections WithSignature: ",
      collectionsWithSignature.address
    );

    //// Save contract data to DB
    save("CollectionsPreset", collections, "zero", env, ver);
    save(
      "CollectionsPresetWithSignature",
      collectionsWithSignature,
      name,
      env,
      ver
    );
  });
