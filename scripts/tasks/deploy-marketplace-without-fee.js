require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-marketplace-without-fee --name Marketplace --ver 1 --env develop --multicall 0x... --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  env - contract environment (stage OR develop);
  multicall - multicall contract address;
*/
task("deploy-marketplace-without-fee")
  .addParam("name")
  .addParam("ver")
  .addParam("env")
  .addParam("multicall")
  .setAction(async ({ name, ver, env, multicall }) => {
    const OWNER_MARKETPLACE_ROLE = hre.ethers.utils.id(
      "OWNER_MARKETPLACE_ROLE"
    );

    const Marketplace = await hre.ethers.getContractFactory(
      "MarketplacePresetWithoutFee"
    );
    const marketplace = await Marketplace.deploy(name, ver);
    await marketplace.deployed();

    const tx = await marketplace.grantRole(OWNER_MARKETPLACE_ROLE, multicall);
    await tx.wait();

    console.log("MarketplaceWithoutFee: ", marketplace.address);
    //// Save contract data to DB
    save("MarketplacePresetWithoutFee", marketplace, name, env, ver);
  });
