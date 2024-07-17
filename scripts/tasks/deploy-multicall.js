require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-multicall --ver 1 --env develop --network localhost
*/

/*
  ver - signature version;
  env - contract environment (stage OR develop);
*/
task("deploy-multicall")
  .addParam("ver")
  .addParam("env")
  .setAction(async ({ ver, env }) => {
    const Multicall = await hre.ethers.getContractFactory("Multicall");
    const multicall = await Multicall.deploy();
    await multicall.deployed();
    console.log("Multicall: ", multicall.address);
    //// Save contract data to DB
    save("Multicall", multicall, "zero", env, ver);
  });
