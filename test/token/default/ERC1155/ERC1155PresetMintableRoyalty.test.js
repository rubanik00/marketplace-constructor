const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect, assert } = require("chai");
const { ethers, network } = require("hardhat");
const { signByUser } = require("../../../helpers/sign1155");

const metadata = "TEST_SID";
const metadata2 = "TEST_SID2";
const tokenUri = "https://testUriDomain/";

describe("ERC1155PresetMintableRoyalty", function () {
  async function deployTokenFixture() {
    const tokenName = "testNameToken";
    const tokenVersion = "1";
    const tokenSymbol = "testSymbolToken";
    const fee = "1000";

    const [owner, signer, creator, firstUser, secondUser] =
      await ethers.getSigners();

    const Token = await ethers.getContractFactory(
      "ERC1155PresetMintableRoyalty"
    );
    const token = await Token.deploy(
      tokenName,
      tokenSymbol,
      tokenVersion,
      tokenUri,
      signer.address,
      fee
    );

    const domain = {
      name: tokenName,
      version: tokenVersion,
      chainId: network.config.chainId,
      verifyingContract: token.address,
    };

    return {
      token,
      domain,
      owner,
      signer,
      creator,
      firstUser,
      secondUser,
    };
  }
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { token, owner } = await loadFixture(deployTokenFixture);
      const DEFAULT_ADMIN_ROLE = token.DEFAULT_ADMIN_ROLE();
      expect(await token.hasRole(DEFAULT_ADMIN_ROLE, owner.address)).to.equal(
        true
      );
    });
  });
  describe("Minting", function () {
    it("Should be possible to mint new token", async function () {
      const { token, domain, signer, creator } = await loadFixture(
        deployTokenFixture
      );

      const supply = 100;
      const fee = 2000;
      const nonce = 1;

      const signature = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata,
        signer
      );
      await token
        .connect(creator)
        ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
          supply,
          fee,
          nonce,
          metadata,
          signature.v,
          signature.r,
          signature.s
        );

      expect(await token.creators(0)).to.be.equal(creator.address);
      const res = await token.royaltyInfo(0, 1000);
      assert.equal(res[1].toString(), "200");
      expect(await token.balanceOf(creator.address, 0)).to.be.equal(
        supply.toString()
      );
      await token.connect(signer).setBaseURI(tokenUri);
      assert.equal(await token.uri(0), tokenUri + metadata);
    });
    it("Should NOT be possible to mint in singer is not signer-role address", async function () {
      const { token, domain, firstUser, creator } = await loadFixture(
        deployTokenFixture
      );

      const supply = 100;
      const fee = 2000;
      const nonce = 2;

      const signature = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata,
        firstUser
      );
      await expect(
        token
          .connect(creator)
          ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
            supply,
            fee,
            nonce,
            metadata,
            signature.v,
            signature.r,
            signature.s
          )
      ).to.be.revertedWith("SignedAdmin should sign tokenId");
    });
    it("Should NOT be possible to mint new token with old nonce", async function () {
      const { token, domain, signer, creator } = await loadFixture(
        deployTokenFixture
      );

      const supply = 90;
      const fee = 2000;
      const nonce = 2;

      const signatureOne = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata2,
        signer
      );
      await token
        .connect(creator)
        ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
          supply,
          fee,
          nonce,
          metadata2,
          signatureOne.v,
          signatureOne.r,
          signatureOne.s
        );

      expect(await token.balanceOf(creator.address, 0)).to.be.equal(
        supply.toString()
      );

      const signatureTwo = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata,
        signer
      );
      await expect(
        token
          .connect(creator)
          ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
            supply,
            fee,
            nonce,
            metadata,
            signatureTwo.v,
            signatureTwo.r,
            signatureTwo.s
          )
      ).to.be.revertedWith("Wrong nonce.");
    });
  });
  describe("Burn", function () {
    it("Should NOT possible to burn token by not creator", async function () {
      const { token, signer, secondUser } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        token.connect(signer).burn(secondUser.address, 0, 22)
      ).to.be.revertedWith("ERC1155: caller is not token owner nor approved");
    });

    it("Should be possible to burn by creator", async function () {
      const { token, domain, signer, creator } = await loadFixture(
        deployTokenFixture
      );

      const supply = 80;
      const fee = 2000;
      const nonce = 5;

      const signature = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata,
        signer
      );
      await token
        .connect(creator)
        ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
          supply,
          fee,
          nonce,
          metadata,
          signature.v,
          signature.r,
          signature.s
        );

      expect(await token.balanceOf(creator.address, 0)).to.be.equal(supply);

      await token
        .connect(creator)
        .burn(creator.address, 0, 20, { gasLimit: 3000000 });

      expect(await token.balanceOf(creator.address, 0)).to.be.equal(60);
    });

    it("Should NOT be possible to burnBatch by not creator", async function () {
      const { token, creator, secondUser } = await loadFixture(
        deployTokenFixture
      );

      await expect(
        token.connect(secondUser).burnBatch(creator.address, [0], [100])
      ).to.be.revertedWith("ERC1155: caller is not token owner nor approved");
    });

    it("Should be possible to burnBatch by signer", async function () {
      const { token, domain, signer, creator } = await loadFixture(
        deployTokenFixture
      );

      const supply = 100;
      const fee = 2000;
      const nonce = 10;

      const signature = await signByUser(
        domain,
        supply,
        nonce,
        fee,
        creator.address,
        metadata,
        signer
      );
      await token
        .connect(creator)
        ["mint(uint256,uint96,uint256,string,uint8,bytes32,bytes32)"](
          supply,
          fee,
          nonce,
          metadata,
          signature.v,
          signature.r,
          signature.s
        );

      await token.connect(creator).burnBatch(creator.address, [0], [100]);
      expect(await token.balanceOf(creator.address, 0)).to.be.equal(0);
    });
  });
});
