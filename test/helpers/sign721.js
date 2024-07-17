const { ethers } = require("hardhat");

const TokenType = {
  SignData: [
    { name: "nonce", type: "uint256" },
    { name: "creator", type: "address" },
    { name: "uri", type: "string" },
  ],
};

const signDataByUser = async (domain, nonce, creator, uri, user) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, TokenType, {
      nonce,
      creator,
      uri,
    })
  );

module.exports = { signDataByUser };
