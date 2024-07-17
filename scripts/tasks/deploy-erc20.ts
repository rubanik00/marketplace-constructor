// import "@nomicfoundation/hardhat-toolbox";
// import { task } from "hardhat/config";
// import save from "./helpers/save-to-db";

// /*
//   Command line example:
//     npx hardhat deploy-erc20 --name testTokenName --ver 1 --symbol TEST --initial-supply 10000000000000000000 --env develop --network localhost
// */

// /*
//   name - token Name;
//   ver - version;
//   symbol - token symbol;
//   initialSupply - initial number of tokens;
//   env - contract environment (stage OR develop);
// */
// task("deploy-erc20")
//   .addParam("name")
//   .addParam("ver")
//   .addParam("symbol")
//   .addParam("initialSupply")
//   .addParam("env")
//   .setAction(async ({ name, ver, symbol, initialSupply, env }, hre) => {
//     const Contract = await hre.ethers.getContractFactory("TestToken20");
//     const token = await Contract.deploy(initialSupply, name, symbol);
//     await token.deployed();

//     console.log("ERC20: ", token.address);
//     //// Save contract data to DB
//     await save(hre, "TestToken20", token, name, env, ver);
//   });
