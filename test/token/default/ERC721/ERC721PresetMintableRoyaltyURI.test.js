const { expect, assert } = require("chai");
const { ethers, network } = require("hardhat");
const { signDataByUser } = require("../../../helpers/sign721fee");

const tokenName = "testNameToken";
const tokenSymbol = "testSymbolToken";
const tokenUri = "https://testUriDomain/";
const metadata = "metadata/";
const tokenVersion = "1";
const feeInBeeps = "1000";

let accounts;
let owner;
let user1;
let user2;
let token;
let domainToken;

describe("ERC721PresetMintableRoyaltyURI", function () {
  before("deploy token", async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const Contract = await ethers.getContractFactory(
      "ERC721PresetMintableRoyaltyURI"
    );
    token = await Contract.connect(owner).deploy(
      tokenName,
      tokenSymbol,
      tokenVersion,
      feeInBeeps,
      tokenUri
    );
    await token.deployed();

    domainToken = {
      name: tokenName,
      version: tokenVersion,
      chainId: network.config.chainId,
      verifyingContract: token.address,
    };
  });
  describe("Mint", function () {
    it("Mint without signature", async function () {
      const fee = 2000;
      const nonce = 1;

      const signature = await signDataByUser(
        domainToken,
        nonce,
        fee,
        user1.address,
        metadata,
        user1
      );

      await expect(
        token
          .connect(user1)
          .mint(fee, nonce, metadata, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
          })
      ).to.be.revertedWith("SignedAdmin should sign tokenId");
    });

    it("Mint with signature", async function () {
      const fee = 2000;
      const nonce = 1;

      const signature = await signDataByUser(
        domainToken,
        nonce,
        fee,
        user1.address,
        metadata,
        owner
      );

      await token
        .connect(user1)
        .mint(fee, nonce, metadata, signature.v, signature.r, signature.s, {
          gasLimit: 3000000,
        });

      expect(await token.creators(0)).to.be.equal(user1.address);
      const res = await token.royaltyInfo(0, 1000);
      assert.equal(res[1].toString(), "200");
      assert.equal(await token.ownerOf(0), user1.address);
    });

    it("Mint with the same signature", async function () {
      const fee = 2000;
      const nonce = 1;

      const signature = await signDataByUser(
        domainToken,
        nonce,
        fee,
        user1.address,
        metadata,
        owner
      );

      await expect(
        token
          .connect(user1)
          .mint(fee, nonce, metadata, signature.v, signature.r, signature.s, {
            gasLimit: 3000000,
          })
      ).to.revertedWith("Wrong nonce.");
    });
  });

  describe("Burn", function () {
    before("mint token", async function () {
      const fee = 2000;
      const nonce = 2;

      const signature = await signDataByUser(
        domainToken,
        nonce,
        fee,
        user2.address,
        metadata,
        owner
      );

      await token
        .connect(user2)
        .mint(fee, nonce, metadata, signature.v, signature.r, signature.s, {
          gasLimit: 3000000,
        });

      expect(await token.creators(1)).to.be.equal(user2.address);
      assert.equal(await token.ownerOf(1), user2.address);
    });

    it("burn by not owner of token", async function () {
      await expect(token.connect(owner).burn(1)).to.be.revertedWith(
        "ERC721: caller is not token owner not approved"
      );
    });

    it("burn by owner of token", async function () {
      await token.connect(user2).burn(1);
      await expect(token.ownerOf(1)).to.be.revertedWith(
        "ERC721: invalid token ID"
      );
    });
  });

  describe("Token Uri", function () {
    it("Set Token Uri", async function () {
      await token.setTokenURI(0, metadata);
      assert.equal(await token.tokenURI(0), tokenUri + metadata);
    });
  });
});
