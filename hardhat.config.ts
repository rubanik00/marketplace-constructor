import * as dotenv from "dotenv";

import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@openzeppelin/hardhat-upgrades";

import "./scripts/tasks/deploy-marketplace-with-fee";
import "./scripts/tasks/deploy-marketplace-without-fee";
import "./scripts/tasks/deploy-auction";
import "./scripts/tasks/deploy-collections-upgr";
import "./scripts/tasks/deploy-collections";
import "./scripts/tasks/deploy-erc721-upgr";
import "./scripts/tasks/deploy-erc721";
import "./scripts/tasks/deploy-erc1155-upgr";
import "./scripts/tasks/deploy-erc1155";
import "./scripts/tasks/deploy-multicall";
import "./scripts/tasks/deploy-erc20";
import { task } from "hardhat/config";
import { HardhatUserConfig } from "hardhat/types";

dotenv.config();
const { DEV_KEY, INFURA_KEY, ETHERSCAN_API_KEY } = process.env;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 1000,
          },
        },
      },
    ],
  },
  mocha: {
    timeout: 3000000000000000,
  },
  networks: {
    goerli: {
      url: `https://goerli.infura.io/v3/${INFURA_KEY}`,
      accounts: [DEV_KEY || ""],
      chainId: 5,
    },
    matic: {
      url: "https://rpc-mainnet.matic.quiknode.pro",
      chainId: 137,
      accounts: [DEV_KEY || ""],
    },
    mumbai: {
      url: "https://rpc-mumbai.maticvigil.com",
      accounts: [DEV_KEY || ""],
    },
    bnbTestnet: {
      url: "https://data-seed-prebsc-2-s1.binance.org:8545/",
      chainId: 97,
      accounts: [DEV_KEY || ""],
    },
    fuji: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [DEV_KEY || ""],
    },
    fantomTestnet: {
      url: "https://rpc.testnet.fantom.network/",
      chainId: 4002,
      accounts: [DEV_KEY || ""],
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
      chainId: 31337,
      gasPrice: 3000000000,
      gasMultiplier: 1,
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY || "",
  },
};

export default config;
