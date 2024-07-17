# NFT Marketplace Contracts

# Description

Modular project **NFT Marketplace**. It has the ability to assemble a final marketplace from different modules. Has an Administrator and implementation of signatures ([EIP712](https://eips.ethereum.org/EIPS/eip-712)).

# Project structure

```
.
├──  contracts/ # contracts
|──────── auction/ # Auction contracts
|──────── default/ # Default token and collection contracts
|──────── marketplace/ # Marketplace contracts
|──────── mock/ # test contract of a regular erc20/erc721/erc1155 tokens
|──────── upgradeable/ # Upgradeable token and collection contracts
├──  scripts/ # cli for deploy/verify actions
├──  test/ # test cases
├──  README.md # current file
├──  .env.sample # example of .env file
├──  .gitignore
├──  hardhat.config.js # config for deploying or testing on various networks
└──  package.json
```

# Local development

## Prerequisites

- [node v15.11.0](https://www.npmjs.com/package/node/v/15.11.0) or higher
- [hardhat v2.9.3](https://www.npmjs.com/package/hardhat/v/2.9.3)
- [solidity v0.8.16](https://github.com/ethereum/solidity/releases/tag/v0.8.16)

## .ENV

Setup .env file

- `DOMAIN_NAME` - contract name for EIP712
- `DOMAIN_VERSION` - contract version for EIP712
- `TOKEN_NAME` - token name
- `TOKEN_SYMBOL` - token symbol
- `INFURA_KEY` - infura api key for upload contracts to test network
- `ADMIN_PK` - admin private key
- `PRIVATE_KEY` - testnet private key
- `ETHERSCAN_API_KEY` - etherscan api key for verify contracts
- `BASE_URI` - base uri for metadata
- `TOKEN_URI` - token uri for metadata
- `CHAIN_ID` - a property of the chain managed by the node

* Install the dependencies

```
npm i
```

- Run the tests

```
npx hardhat test
```

- Compile the contracts

```
npx hardhat compile
```

# Smart contracts

| Contract              | Description                                                                                                                                                                        |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Auction               | Contract with the main functions of the Auction. Will be used as an addition to the marketplace.                                                                                   |
| Marketplace           | A contract that has different variations of the implementation of the Marketplace. It has all the main functions of the Marketplace. Can be deployed without additional contracts. |
| Collections           | The contract is created to create Collections of tokens. Can be used as an add-on contract. Can be upgradeable or static.                                                          |
| Multicall             | The contract is created to call admin methods of different trusted contracts.                                                                                                      |
| ERC721Implementation  | ERC721 token contract. Can be upgradeable or static. Can be deployed without additional contracts.                                                                                 |
| ERC1155Implementation | ERC1155 token contract. Can be upgradeable or static. Can be deployed without additional contracts.                                                                                |

## Smart contract descriptions

### ERC721Implementation

User can mint tokens using admin sign. If user have tokens of ERC721Implementation it is possible to create collection, using Collection contract, or sell tokens throw marketplace. If user decide to sell tokens, using Marketplace contract, Marketplace transfer tokens from his balance.

#### Capabilities:

##### For user:

- Possible **mint** tokens, but only if admin signer **sign** token **data**

- Possible **transfer** tokens

- Get all information about tokens

- Get tokens **metadata**

##### For owner:

- Change endpoint for receiving **metadata**

### ERC1155Implementation

User can mint tokens using admin sign. If user have tokens of ERC1155Implementation it is possible to create collection, using Collection contract, or sell tokens throw marketplace. If user decide to sell tokens, using Marketplace contract, Marketplace transfer tokens from his balance.

#### Capabilities:

##### For user:

- Possible **mint** tokens, but only if admin signer **sign** token **data**

- Possible **transfer** tokens

- Get all information about tokens

- Get tokens **metadata**

##### For owner:

- Change endpoint for receiving **metadata**

### Marketplace

User can sell tokens or use auction functionality. If someone buy tokens, Marketplace transfer profit to seller. Profit calculate next: profit = total paid amount - platform fee (- creator fee, if seller is not token creator). After profit payed, Marketplace transfer tokens to buyer.

In auction users make bids. When user make bid, if there is any bidder in this auction before, calls transaction that return last bid to last bidder and set caller as new bidder. If one user make bid in **time extending range**, after that auction end time increase on **time extending value**. When auction end impossible make any bids. After than any user can call claim function. This function pay profit to seller and transfer tokens to buyer.

#### Capabilities:

##### For user:

- Possible to **create auction**, but only if admin signer **sign** auction **data**

- Possible to **edit auction**, but only if auction have no bidders

- Possible to **delete auction**, but only if auction have no bidders

- Possible to **claim auction**, but only if auction ended

- Possible to **make bid** on auction, but only if auction is not ended

- Possible to **cancel auction**, but only if admin admin **sign** auction **data**

- Possible to **create trade lot**, but only if admin signer **sign** trade **data**

- Possible to **edit trade lot**

- Possible to **delete trade lot**

- Possible to **buy tokens** on trade lot

- Get information about auction and trade lot

##### For admin:

- Possible to **sign auction cancel**, if some problem with auction

##### For owner:

- Possible to set **dependencies**

- Possible to set **platform fee**

- Possible to set **time extending range**

- Possible to set **time extending value**

- Possible to set new **fee collector**

### Collections

User can create collection without tokens. If user want add any token to collection, it can be possible only if user - creator of this token and user has full amount of this tokens. Same case for remove tokens. Create collection possible only with admin sign. Collection possible create only using ERC1155Implementation tokens.

#### Capabilities:

##### For user:

- Possible to **create collection**, but only if admin signer **sign** collection **data**

- Possible to **delete collection**, but only if user have all tokens that included in this collection

- Possible to **add tokens** to collection, but only if user have all tokens that will included in this collection

- Possible to **remove tokens** from collection, but only if user have all tokens that will remove from this collection

- Get information about collections

### Multicall

Multicall contract is deployed to the Marketplace owner for a convenient call to all admin functions. After Multicall is deployed, trusted contracts must be added. Multicall must have an admin role for trusted contracts.

#### Capabilities:

##### For owner:

- Possible to set **new contracts to call**

- Possible to **aggregate call**

# Quick Start

To compile and deploy contracts to any Network fill in `.env` by example `.env.example` and run:

1. Deploy script

```
npx hardhat run scripts/CHOOSE_SCRIPT_TO_DEPLOY --network NAME
```

2. Verify

```
npx hardhat verify --constructor-args arguments.js CONTRACT_ADDRESS --network NAME
```

# Usage

Contracts are processed in the following stages:

1. Compilation
2. Deployment
3. Configuration
4. Interactions on-chain

## Compilation

To compile the contracts run:

```
npx hardhat compile
```

Artifacts are stored in the `artifacts` and directory.

## Deployment

For deployment step the following command should be used:

```
npx hardhat run scripts/CHOOSE_SCRIPT_TO_DEPLOY --network
```

_Addresses of deployed contracts are displayed in terminal._

# Testing

If you'd like to run tests on the local environment, you might want to run tests using the following command:
```
npx hardhat test --network localhost

```

# List of useful commands

```
npx hardhat accounts
npx hardhat compile
npx hardhat clean
npx hardhat test
npx hardhat node
npx hardhat help
REPORT_GAS=true npx hardhat test
npx hardhat coverage
npx hardhat run scripts/deploy.ts
TS_NODE_FILES=true npx ts-node scripts/deploy.ts
npx eslint '**/*.{js,ts}'
npx eslint '**/*.{js,ts}' --fix
npx prettier '**/*.{json,sol,md}' --check
npx prettier '**/*.{json,sol,md}' --write
npx solhint 'contracts/**/*.sol'
npx solhint 'contracts/**/*.sol' --fix
npx hardhat test --network localhost
npx hardhat run scripts/deploy.ts --network localhost
npx hardhat verify --constructor-args arguments.js CONTRACT_ADDRESS
```
