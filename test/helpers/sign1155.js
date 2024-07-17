const { ethers } = require("hardhat");

const types = {
  SignDataWithFee: [
    { name: "supply", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "fee", type: "uint96" },
    { name: "uri", type: "string" },
    { name: "creator", type: "address" },
  ],
};

const signByUser = async (domain, supply, nonce, fee, creator, uri, user) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, types, {
      supply,
      nonce,
      fee,
      uri,
      creator,
    })
  );

module.exports = {
  signByUser,
};
