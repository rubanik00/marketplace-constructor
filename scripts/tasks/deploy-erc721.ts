// import "@nomicfoundation/hardhat-toolbox";
// import { task } from "hardhat/config";
// import save from "../tasks/helpers/save-to-db";

// /*
//   Command line example:
//     npx hardhat deploy-erc721 --name testTokenName --ver 1 --symbol TEST --fee-in-beeps 1000 --env develop --network localhost
// */

// /*
//   name - signature name;
//   ver - signature version;
//   symbol - token symbol;
//   feeInBeeps - fee in beeps (1% = 100);
//   env - contract environment (stage OR develop);
// */
// task("deploy-erc721")
//   .addParam("name")
//   .addParam("ver")
//   .addParam("symbol")
//   .addParam("feeInBeeps")
//   .addParam("env")
//   .setAction(async ({ name, ver, symbol, feeInBeeps, env }, hre) => {
//     const tokenUri = process.env.BASE_URI || "";

//     const Contract = await hre.ethers.getContractFactory(
//       "ERC721PresetMintableRoyaltyURI"
//     );
//     const token = await Contract.deploy(
//       name,
//       symbol,
//       ver,
//       feeInBeeps,
//       tokenUri
//     );
//     await token.deployed();

//     console.log("ERC721PresetMintableRoyaltyURI: ", token.address);

//     const Contract2 = await hre.ethers.getContractFactory(
//       "ERC721PresetMintableURI"
//     );
//     const token2 = await Contract2.deploy(name, symbol, ver, tokenUri);
//     await token2.deployed();

//     console.log("ERC721PresetMintableURI: ", token2.address);
//     //// Save contract data to DB
//     await save(hre, "ERC721PresetMintableRoyaltyURI", token, name, env, ver);
//     await save(hre, "ERC721PresetMintableURI", token2, name, env, ver);
//   });
