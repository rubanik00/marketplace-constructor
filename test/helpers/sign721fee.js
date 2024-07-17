const { ethers } = require("hardhat");

const TokenType = {
  SignData: [
    { name: "nonce", type: "uint256" },
    { name: "fee", type: "uint96" },
    { name: "creator", type: "address" },
    { name: "uri", type: "string" },
  ],
};

const signDataByUser = async (domain, nonce, fee, creator, uri, user) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, TokenType, {
      nonce,
      fee,
      creator,
      uri,
    })
  );

module.exports = { signDataByUser };
