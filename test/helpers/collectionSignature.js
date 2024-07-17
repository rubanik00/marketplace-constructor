const { ethers } = require("hardhat");

const collectionTypes = {
  SignData: [
    { name: "tokens", type: "uint256[]" },
    { name: "implementation", type: "address" },
    { name: "creator", type: "address" },
  ],
};

const signCollectionByUser = async (user, domain, tokens, implementation, creator) =>
  ethers.utils.splitSignature(
    await user._signTypedData(domain, collectionTypes, {
      tokens,
      implementation,
      creator,
    })
  );

module.exports = {
  signCollectionByUser,
};
