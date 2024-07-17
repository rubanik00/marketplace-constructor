require("@nomicfoundation/hardhat-toolbox");
const { save } = require("./helpers/save_to_db");

/*
  Command line example:
    npx hardhat deploy-erc721-upgr --name testTokenName --ver 1 --symbol TEST --fee-in-beeps 1000 --env develop --network localhost
*/

/*
  name - signature name;
  ver - signature version;
  symbol - token symbol;
  feeInBeeps - fee in beeps (1% = 100);
  env - contract environment (stage OR develop);
*/
task("deploy-erc721-upgr")
  .addParam("name")
  .addParam("ver")
  .addParam("symbol")
  .addParam("feeInBeeps")
  .addParam("env")
  .setAction(async ({ name, ver, symbol, feeInBeeps, env }) => {
    const tokenUri = process.env.BASE_URI;
    console.log(tokenUri);

    const Token = await ethers.getContractFactory(
      "ERC721PresetMintableRoyaltyURIUpgradeable"
    );

    token = await upgrades.deployProxy(
      Token,
      [name, symbol, ver, feeInBeeps, tokenUri],
      { initializer: "initialize" }
    );

    console.log("ERC721PresetMintableURI: ", token.address);

    const Contract2 = await ethers.getContractFactory(
      "ERC721PresetMintableURIUpgradeable"
    );
    token2 = await upgrades.deployProxy(
      Contract2,
      [name, symbol, ver, tokenUri],
      { initializer: "initialize" }
    );
    await token2.deployed();

    console.log("ERC721PresetMintableURIUpgradeable: ", token2.address);
    //// Save contract data to DB
    save("ERC721PresetMintableRoyaltyURIUpgradeable", token, name, env, ver);
    save("ERC721PresetMintableURIUpgradeable", token2, name, env, ver);
  });
