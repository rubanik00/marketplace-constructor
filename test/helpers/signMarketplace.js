const { ethers } = require("hardhat");

const MarketplaceType = {
  SignData: [
    { name: "tokenId", type: "uint256" },
    { name: "quantity", type: "uint256" },
    { name: "price", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "token", type: "address" },
    { name: "saleToken", type: "address" },
    { name: "buyer", type: "address" },
    { name: "tokenType", type: "bool" },
  ],
};

const signDataByUser = async (
  domain,
  tokenId,
  quantity,
  price,
  nonce,
  token,
  saleToken,
  buyer,
  tokenType,
  user
) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, MarketplaceType, {
      tokenId,
      quantity,
      price,
      nonce,
      token,
      saleToken,
      buyer,
      tokenType,
    })
  );

module.exports = { signDataByUser };
