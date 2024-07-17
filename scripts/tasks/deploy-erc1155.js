require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-erc1155 --name testTokenName --ver 1 --symbol TEST --fee-in-beeps 1000 --signer 0x... --env develop --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  symbol - token symbol;
  feeInBeeps - fee in beeps (1% = 100);
  signer - signer address;
  env - contract environment (stage OR develop);
*/
task("deploy-erc1155")
  .addParam("name")
  .addParam("ver")
  .addParam("symbol")
  .addParam("feeInBeeps")
  .addParam("signer")
  .addParam("env")
  .setAction(async ({ name, ver, symbol, feeInBeeps, signer, env }) => {
    const tokenUri = process.env.BASE_URI;

    const Token = await ethers.getContractFactory(
      "ERC1155PresetMintableRoyalty"
    );
    const token = await Token.deploy(
      name,
      symbol,
      ver,
      tokenUri,
      signer,
      feeInBeeps
    );
    await token.deployed();
    console.log("ERC1155PresetMintableRoyalty: ", token.address);
    //// Save contract data to DB
    save("ERC1155PresetMintableRoyalty", token, name, env, ver);
  });
