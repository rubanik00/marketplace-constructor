require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-auction --ver 1 --env develop --multicall 0x... --network localhost
*/

/*
  ver - version;
  env - contract environment (stage OR develop);
  multicall - multicall contract address;
*/
task("deploy-auction")
  .addParam("ver")
  .addParam("env")
  .addParam("multicall")
  .setAction(async ({ ver, env, multicall }) => {
    const AUCTION = hre.ethers.utils.id("OWNER_AUCTION_ROLE");

    const contractName = "Auction";

    const Auction = await ethers.getContractFactory(contractName);
    const auction = await Auction.deploy();
    await auction.deployed();
    let tx = await auction.init();
    await tx.wait();

    tx = await auction.grantRole(AUCTION, multicall);
    await tx.wait();

    console.log("Auction: ", auction.address);

    //// Save contract data to DB
    save(contractName, auction, "zero", env, ver);
  });
