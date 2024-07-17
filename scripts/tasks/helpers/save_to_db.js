const fs = require("fs");
const { resolve } = require("path");

const networks = {
  mainnet: "ethereum",
  goerli: "ethereum",
  mumbai: "polygon",
  fuji: "avalanche",
  fantomTestnet: "fantom",
  localhost: "localhost",
};

function save(contractName, contract, name, env, version) {
  const cwd = process.cwd();

  //// Find network & Save network config
  fs.mkdirSync(
    resolve(cwd, `deployments/${env}/${networks[hre.network.name]}/abis`),
    {
      recursive: true,
    }
  );

  // save network config
  try {
    fs.writeFileSync(
      `deployments/${env}/${networks[hre.network.name]}/network.json`,
      JSON.stringify({
        name: hre.network.name,
        chainId: hre.network.config.chainId,
      })
    );
  } catch (err) {
    console.error(err);
  }

  //// Save Abi
  const abiPath = resolve(
    cwd,
    `deployments/${env}/${
      networks[hre.network.name]
    }/abis/${contractName}_V${version}.json`
  );

  try {
    fs.writeFileSync(
      abiPath,
      contract.interface.format(hre.ethers.utils.FormatTypes.json)
    );
  } catch (err) {
    console.error(err);
  }

  //// Save contract data
  let contractData = {};
  if (name == "zero") {
    contractData = {
      address: contract.address,
      version: version,
      startingBlock: contract.provider._maxInternalBlockNumber,
    };
  } else {
    contractData = {
      address: contract.address,
      name: name,
      version: version,
      startingBlock: contract.provider._maxInternalBlockNumber,
    };
  }

  const pathToContractsData = `deployments/${env}/${
    networks[hre.network.name]
  }/contracts.json`;
  try {
    const obj = JSON.parse(fs.readFileSync(pathToContractsData));
    obj[`${contractName}_V${version}`] = contractData;
    try {
      fs.writeFileSync(pathToContractsData, JSON.stringify(obj));
    } catch (err) {
      console.error(err);
    }
  } catch (err) {
    try {
      fs.writeFileSync(
        pathToContractsData,
        JSON.stringify({
          [`${contractName}_V${version}`]: contractData,
        })
      );
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = { save };
