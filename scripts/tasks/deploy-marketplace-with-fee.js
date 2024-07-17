require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");
const { types } = require("hardhat/config");

/*
  Command line example:
    npx hardhat deploy-marketplace-with-fee --name Marketplace --ver 1 --fee-in-beeps 10000 --env develop --multicall 0x... --whitelist "0x... 0x..."  --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  feeInBeeps - fee in beeps (1% = 1000);
  env - contract environment (stage OR develop);
  multicall - multicall contract address;
  whitelist - erc20 addresses to be added to the whitelist; // --whitelist "address address" OR --whitelist ""
*/
task("deploy-marketplace-with-fee")
  .addParam("name")
  .addParam("ver")
  .addParam("feeInBeeps")
  .addParam("env")
  .addParam("multicall")
  .addParam("whitelist", types.json)
  .setAction(async ({ name, ver, feeInBeeps, env, multicall, whitelist }) => {
    const OWNER_MARKETPLACE_ROLE = hre.ethers.utils.id(
      "OWNER_MARKETPLACE_ROLE"
    );

    const contractName = "MarketplacePresetWithFee";

    const Marketplace = await hre.ethers.getContractFactory(contractName);
    const marketplace = await Marketplace.deploy(feeInBeeps, name, ver);
    await marketplace.deployed();

    console.log("MarketplaceWithFee: ", marketplace.address);

    let tx = await marketplace.grantRole(OWNER_MARKETPLACE_ROLE, multicall);
    await tx.wait();

    if (whitelist.length != 0) {
      const erc20Array = whitelist.split(" ");
      console.log(erc20Array);
      tx = await marketplace.addTokensToWhitelist(erc20Array);
      await tx.wait();
    }
    //// Save contract data to DB
    save(contractName, marketplace, name, env, ver);
  });
