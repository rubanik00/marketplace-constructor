const { expect, assert } = require("chai");
const { ethers } = require("hardhat");
const { signDataByUser } = require("../helpers/signMarketplace");
const name = "Marketplace";
const version = "1";
const metadata = "https://token-cdn-domain/";

const OWNER_MARKETPLACE_ROLE = ethers.utils.id("OWNER_MARKETPLACE_ROLE");
let accounts;
let owner;
let user1;
let user2;
let marketplace;
let erc20_1, erc20_2, erc20_3;
let erc1155_1, erc1155_2, erc1155_3;
let erc721_1, erc721_2, erc721_3noR;
let domainMarketplace;
let multicall;

describe("MarketplacePresetWithFee", function () {
  before("deploy", async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const Marketplace = await ethers.getContractFactory(
      "MarketplacePresetWithFee"
    );
    marketplace = await Marketplace.connect(owner).deploy(10000, name, version);
    await marketplace.deployed();

    const Multicall = await ethers.getContractFactory("Multicall");
    multicall = await Multicall.connect(user1).deploy();
    await multicall.deployed();

    await marketplace.grantRole(OWNER_MARKETPLACE_ROLE, multicall.address);

    const ERC20 = await ethers.getContractFactory("TestToken20");
    erc20_1 = await ERC20.connect(owner).deploy(
      ethers.utils.parseUnits("100", "ether"),
      "Test1",
      "TST1"
    );
    await erc20_1.deployed();

    erc20_2 = await ERC20.connect(owner).deploy(
      ethers.utils.parseUnits("100", "ether"),
      "Test2",
      "TST2"
    );
    await erc20_2.deployed();

    erc20_3 = await ERC20.connect(owner).deploy(
      ethers.utils.parseUnits("100", "ether"),
      "Test3",
      "TST3"
    );
    await erc20_3.deployed();

    const ERC721 = await ethers.getContractFactory("TestToken721");
    erc721_1 = await ERC721.connect(user1).deploy(
      "Test721_1",
      "Test721_1",
      1000
    );
    await erc721_1.deployed();

    erc721_2 = await ERC721.connect(owner).deploy(
      "Test721_2",
      "Test721_2",
      1000
    );
    await erc721_2.deployed();

    const ERC721noR = await ethers.getContractFactory(
      "TestERC721WithoutRoyalties"
    );

    erc721_3noR = await ERC721noR.connect(owner).deploy(
      "Test721_3",
      "Test721_3"
    );
    await erc721_2.deployed();

    const ERC1155 = await ethers.getContractFactory("TestToken1155");
    erc1155_1 = await ERC1155.connect(owner).deploy(
      "Test1155_1",
      "Test1155_1",
      metadata,
      1000
    );
    await erc1155_1.deployed();

    erc1155_2 = await ERC1155.connect(owner).deploy(
      "Test1155_2",
      "Test1155_2",
      metadata,
      1000
    );
    await erc1155_2.deployed();

    erc1155_3 = await ERC1155.connect(owner).deploy(
      "Test1155_3",
      "Test1155_3",
      metadata,
      1000
    );
    await erc1155_3.deployed();

    domainMarketplace = {
      name: name,
      version: version,
      chainId: network.config.chainId,
      verifyingContract: marketplace.address,
    };
  });
  describe("Whitelist", function () {
    it("Fail: add token to whitelist by user", async function () {
      await expect(
        marketplace
          .connect(user1)
          .addTokensToWhitelist([erc20_1.address, erc20_2.address])
      ).to.be.revertedWith("Caller is not an owner.");
    });

    it("Success: add tokens to whitelist by owner", async function () {
      await marketplace
        .connect(owner)
        .addTokensToWhitelist([
          erc20_1.address,
          erc20_2.address,
          erc20_3.address,
        ]);
    });

    it("Success: check tokens in whitelist", async function () {
      const erc20Res = await marketplace.getWhitelistedTokens();
      assert.equal(erc20Res.length, 3);
    });

    it("Fail: remove token from whitelist by user", async function () {
      await expect(
        marketplace
          .connect(user1)
          .removeTokensFromWhitelist([erc20_1.address, erc20_2.address])
      ).to.be.revertedWith("Caller is not an owner.");
    });

    it("Success: remove tokens from whitelist by owner", async function () {
      await marketplace
        .connect(owner)
        .removeTokensFromWhitelist([erc20_2.address]);
    });

    it("Success: check tokens in whitelist", async function () {
      const erc20Res = await marketplace.getWhitelistedTokens();
      assert.equal(erc20Res.length, 2);
    });
  });

  describe("Create offer", function () {
    before("mint erc1155,erc20,erc721", async function () {
      await erc20_1
        .connect(user1)
        .mint(ethers.utils.parseUnits("100", "ether"));
      await erc20_2
        .connect(user1)
        .mint(ethers.utils.parseUnits("100", "ether"));
      await erc20_3
        .connect(user1)
        .mint(ethers.utils.parseUnits("100", "ether"));

      await erc20_1
        .connect(user2)
        .mint(ethers.utils.parseUnits("100", "ether"));
      await erc20_2
        .connect(user2)
        .mint(ethers.utils.parseUnits("100", "ether"));
      await erc20_3
        .connect(user2)
        .mint(ethers.utils.parseUnits("100", "ether"));

      await erc1155_1
        .connect(owner)
        .mintBatch(user1.address, [1, 2, 3, 4, 5], [100, 100, 100, 100, 100]);

      await erc1155_2
        .connect(owner)
        .mintBatch(user2.address, [1, 2, 3, 4, 5], [100, 100, 100, 100, 100]);

      await erc1155_2
        .connect(owner)
        .mintBatch(owner.address, [1, 2, 3, 4, 5], [100, 100, 100, 100, 100]);

      await erc1155_2
        .connect(owner)
        .mintBatch(user1.address, [1, 2, 3, 4, 5], [100, 100, 100, 100, 100]);

      await erc721_1.connect(user2).mint(metadata, 1);

      await erc721_2.connect(owner).mint(metadata, 101);
      await erc721_3noR.connect(owner).mint(metadata, 222);
      await erc721_3noR.connect(owner).mint(metadata, 333);
    });

    it("Fail: create offer with non-whitelisted sale token", async function () {
      assert.isFalse(await marketplace.isOfferExist(0));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
      await erc1155_2
        .connect(user1)
        .setApprovalForAll(marketplace.address, true);

      const nonce = 1;
      const tokenId = 1;
      const quantity = 10;
      const price = ethers.utils.parseUnits("1", "ether");
      const token = erc1155_2.address;
      const saleToken = erc20_2.address;
      const tokenType = true;

      const signature = await signDataByUser(
        domainMarketplace,
        tokenId,
        quantity,
        price,
        nonce,
        token,
        saleToken,
        user1.address,
        tokenType,
        owner
      );

      await expect(
        marketplace.connect(user1).createOffer(
          {
            tokenId: tokenId,
            quantity: quantity,
            price: price,
            nonce: nonce,
            token: token,
            saleToken: saleToken,
            buyer: user1.address,
            tokenType: tokenType,
          },
          { v: signature.v, r: signature.r, s: signature.s }
        )
      ).to.be.revertedWith("Cannot be sold for this token.");
      assert.isFalse(await marketplace.isOfferExist(0));
    });

    it("Success: create offer with erc1155 by token Erc20", async function () {
      assert.isFalse(await marketplace.isOfferExist(0));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);

      const nonce = 1;
      const tokenId = 1;
      const quantity = 10;
      const price = ethers.utils.parseUnits("1", "ether");
      const token = erc1155_2.address;
      const saleToken = erc20_1.address;
      const tokenType = true;

      const signature = await signDataByUser(
        domainMarketplace,
        tokenId,
        quantity,
        price,
        nonce,
        token,
        saleToken,
        user1.address,
        tokenType,
        owner
      );

      await marketplace.connect(user1).createOffer(
        {
          tokenId: tokenId,
          quantity: quantity,
          price: price,
          nonce: nonce,
          token: token,
          saleToken: saleToken,
          buyer: user1.address,
          tokenType: tokenType,
        },
        { v: signature.v, r: signature.r, s: signature.s }
      );
      assert.isTrue(await marketplace.isOfferExist(0));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
    });

    it("Fail: create offer with erc1155 by token Erc20 with wrong nonce", async function () {
      assert.isFalse(await marketplace.isOfferExist(1));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);

      const nonce = 1;
      const tokenId = 1;
      const quantity = 10;
      const price = ethers.utils.parseUnits("1", "ether");
      const token = erc1155_2.address;
      const saleToken = erc20_1.address;
      const tokenType = true;

      const signature = await signDataByUser(
        domainMarketplace,
        tokenId,
        quantity,
        price,
        nonce,
        token,
        saleToken,
        user1.address,
        tokenType,
        owner
      );

      await expect(
        marketplace.connect(user1).createOffer(
          {
            tokenId: tokenId,
            quantity: quantity,
            price: price,
            nonce: nonce,
            token: token,
            saleToken: saleToken,
            buyer: user1.address,
            tokenType: tokenType,
          },
          { v: signature.v, r: signature.r, s: signature.s }
        )
      ).to.be.revertedWith("Wrong nonce.");

      assert.isFalse(await marketplace.isOfferExist(1));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
    });

    it("Success: create offer with erc1155 by token Erc20 again", async function () {
      assert.isFalse(await marketplace.isOfferExist(1));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);

      const nonce = 2;
      const tokenId = 1;
      const quantity = 1;
      const price = ethers.utils.parseUnits("1", "ether");
      const token = erc1155_2.address;
      const saleToken = erc20_1.address;
      const tokenType = true;

      const signature = await signDataByUser(
        domainMarketplace,
        tokenId,
        quantity,
        price,
        nonce,
        token,
        saleToken,
        user1.address,
        tokenType,
        owner
      );

      await marketplace.connect(user1).createOffer(
        {
          tokenId: tokenId,
          quantity: quantity,
          price: price,
          nonce: nonce,
          token: token,
          saleToken: saleToken,
          buyer: user1.address,
          tokenType: tokenType,
        },
        { v: signature.v, r: signature.r, s: signature.s }
      );
      assert.isTrue(await marketplace.isOfferExist(1));
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
    });

    it("Success: create offer with erc721 by eth", async function () {
      await erc721_1
        .connect(user2)
        .setApprovalForAll(marketplace.address, true);
      assert.isFalse(await marketplace.isOfferExist(2));
      assert.equal(await erc721_1.ownerOf(1), user2.address);

      const nonce = 1;
      const tokenId = 1;
      const quantity = 0;
      const price = ethers.utils.parseUnits("1", "ether");
      const token = erc721_1.address;
      const saleToken = ethers.constants.AddressZero;
      const tokenType = false;

      const signature = await signDataByUser(
        domainMarketplace,
        tokenId,
        quantity,
        price,
        nonce,
        token,
        saleToken,
        user2.address,
        tokenType,
        owner
      );

      await marketplace.connect(user2).createOffer(
        {
          tokenId: tokenId,
          quantity: quantity,
          price: price,
          nonce: nonce,
          token: token,
          saleToken: saleToken,
          buyer: user2.address,
          tokenType: tokenType,
        },
        { v: signature.v, r: signature.r, s: signature.s }
      );
      assert.isTrue(await marketplace.isOfferExist(2));
      assert.equal(await erc721_1.ownerOf(1), user2.address);
    });

    it("Success: Create offer by owner with eth", async function () {
      await erc721_2
        .connect(owner)
        .setApprovalForAll(marketplace.address, true);
      const tokenId = 101;
      const quantity = 0;
      const price = ethers.utils.parseUnits("3", "ether");
      const token = erc721_2.address;
      const saleToken = ethers.constants.AddressZero;
      const tokenType = false;

      await marketplace
        .connect(owner)
        .createInternalOffer(
          token,
          tokenId,
          quantity,
          saleToken,
          price,
          tokenType
        );
    });

    it("Success: Create offer by owner with token1155", async function () {
      await erc1155_2
        .connect(owner)
        .setApprovalForAll(marketplace.address, true);

      const tokenId = 3;
      const quantity = 20;
      const price = ethers.utils.parseUnits("2", "ether");
      const token = erc1155_2.address;
      const saleToken = ethers.constants.AddressZero;
      const tokenType = true;

      await marketplace
        .connect(owner)
        .createInternalOffer(
          token,
          tokenId,
          quantity,
          saleToken,
          price,
          tokenType
        );
    });

    it("Success: Create offer by owner with token721 without royalties with Token", async function () {
      await erc721_3noR
        .connect(owner)
        .setApprovalForAll(marketplace.address, true);

      const tokenId = 222;
      const quantity = 1;
      const price = ethers.utils.parseUnits("2", "ether");
      const token = erc721_3noR.address;
      const saleToken = erc20_1.address;
      const tokenType = false;

      await marketplace
        .connect(owner)
        .createInternalOffer(
          token,
          tokenId,
          quantity,
          saleToken,
          price,
          tokenType
        );

      assert.isTrue(await marketplace.isOfferExist(5));
    });

    it("Success: Create offer by owner with token721 without royalties with ETH", async function () {
      await erc721_3noR
        .connect(owner)
        .setApprovalForAll(marketplace.address, true);

      const tokenId = 333;
      const quantity = 1;
      const price = ethers.utils.parseUnits("2", "ether");
      const token = erc721_3noR.address;
      const saleToken = ethers.constants.AddressZero;
      const tokenType = false;

      await marketplace
        .connect(owner)
        .createInternalOffer(
          token,
          tokenId,
          quantity,
          saleToken,
          price,
          tokenType
        );

      assert.isTrue(await marketplace.isOfferExist(6));
    });
  });

  describe("Edit offer", function () {
    it("Fail: Edit of a non-existent offer", async function () {
      await expect(
        marketplace.editOffer(100, 1, 10, ethers.constants.AddressZero)
      ).to.be.revertedWith("Offer does not exist.");
    });

    it("Fail: Edit Offer by not creator", async function () {
      await expect(
        marketplace
          .connect(owner)
          .editOffer(0, 1, 10, ethers.constants.AddressZero)
      ).to.be.revertedWith("Not creator of offer");
    });

    it("Fail: Price should be positive", async function () {
      await expect(
        marketplace
          .connect(user1)
          .editOffer(0, 1, 0, ethers.constants.AddressZero)
      ).to.be.revertedWith("Price should be positive");
    });
    it("Fail: Quantity should be positive", async function () {
      await expect(
        marketplace
          .connect(user1)
          .editOffer(0, 0, 1, ethers.constants.AddressZero)
      ).to.be.revertedWith("Quantity should be positive");
    });
    it("Fail: Sale token should be in whiteList", async function () {
      await expect(
        marketplace.connect(user1).editOffer(0, 1, 10, owner.address)
      ).to.be.revertedWith("Cannot be sold for this token.");
    });
    it("Success: Edit to a smaller quantity", async function () {
      await marketplace
        .connect(user1)
        .editOffer(
          0,
          5,
          ethers.utils.parseUnits("1", "ether"),
          erc20_1.address
        );
      const info = await marketplace.getOfferInfo(0);
      assert.equal(info.quantity.toString(), "5");
    });
    it("Success: Edit to a higher quantity", async function () {
      await marketplace
        .connect(user1)
        .editOffer(
          0,
          10,
          ethers.utils.parseUnits("1", "ether"),
          erc20_1.address
        );
      const info = await marketplace.getOfferInfo(0);
      assert.equal(info.quantity.toString(), "10");
    });
  });

  describe("Purchase", function () {
    it("Fail: Offer does not exist", async function () {
      await expect(
        marketplace.connect(user2).purchase(10, 3)
      ).to.be.revertedWith("Offer does not exist.");
    });

    it("Fail: Quantity too big", async function () {
      await expect(
        marketplace.connect(user2).purchase(0, 30)
      ).to.be.revertedWith("Quantity too big.");
    });

    it("Fail: You are owner of the offer", async function () {
      await expect(
        marketplace.connect(user1).purchase(0, 3)
      ).to.be.revertedWith("You are owner of the offer.");
    });

    it("Fail: Value is not equal to price", async function () {
      await expect(
        marketplace
          .connect(user1)
          .purchase(4, 10, { value: ethers.utils.parseUnits("10", "ether") })
      ).to.be.revertedWith("Value is not equal to price.");
    });

    it("Fail: Purchase with token when creator made transfer (ERC1155: insufficient balance for transfer)", async function () {
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
      assert.equal(await erc1155_2.balanceOf(owner.address, 1), 100);
      await erc1155_2
        .connect(user1)
        .safeTransferFrom(user1.address, owner.address, 1, 99, 0);
      assert.equal(await erc1155_2.balanceOf(owner.address, 1), 199);
      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 1);

      await erc20_1
        .connect(user2)
        .approve(marketplace.address, ethers.utils.parseUnits("10", "ether"));

      await expect(
        marketplace.connect(user2).purchase(0, 3)
      ).to.be.revertedWith("ERC1155: insufficient balance for transfer");

      await erc1155_2
        .connect(owner)
        .safeTransferFrom(owner.address, user1.address, 1, 99, 0);

      assert.equal(await erc1155_2.balanceOf(user1.address, 1), 100);
      assert.equal(await erc1155_2.balanceOf(owner.address, 1), 100);
    });

    it("Success: Purchase with token", async function () {
      let offer = await marketplace.offers(0);
      assert.equal(offer.quantity, 10);
      assert.equal(await erc1155_2.balanceOf(user2.address, 1), 100);
      const beforeCreator = await erc20_1.balanceOf(user1.address);
      const before = await erc20_1.balanceOf(user2.address);
      const beforeRoyaltyOwner = await erc20_1.balanceOf(owner.address);

      const tx = await marketplace.connect(user2).purchase(0, 3);
      const receipt = await tx.wait();

      console.log("Gas used: ", receipt.gasUsed.toString());

      const after = await erc20_1.balanceOf(user2.address);
      const afterCreator = await erc20_1.balanceOf(user1.address);
      const afterRoyaltyOwner = await erc20_1.balanceOf(owner.address);

      assert.equal((before - after) / 1e18, 3);
      assert.equal((afterCreator - beforeCreator) / 1e18, 2.4);
      assert.equal(await erc1155_2.balanceOf(user2.address, 1), 103);
      assert.equal((afterRoyaltyOwner - beforeRoyaltyOwner) / 1e18, 0.3);
      offer = await marketplace.offers(0);
      assert.equal(offer.quantity, 7);
    });

    it("Success: Purchase with eth", async function () {
      let offer = await marketplace.offers(4);
      assert.equal(offer.quantity, 20);
      assert.equal(await erc1155_2.balanceOf(user1.address, 3), 100);
      const beforeCreator = await ethers.provider.getBalance(owner.address);
      const before = await ethers.provider.getBalance(user1.address);

      await marketplace
        .connect(user1)
        .purchase(4, 10, { value: ethers.utils.parseUnits("20", "ether") });
      const afterCreator = await ethers.provider.getBalance(owner.address);
      const after = await ethers.provider.getBalance(user1.address);
      console.log((before - after) / 1e18);
      console.log((afterCreator - beforeCreator) / 1e18);
      assert.equal(await erc1155_2.balanceOf(user1.address, 3), 110);
      offer = await marketplace.offers(4);
      assert.equal(offer.quantity, 10);
    });

    it("Success: Purchase with eth (buy all tokens)", async function () {
      const offer = await marketplace.offers(4);
      assert.equal(offer.quantity, 10);
      assert.equal(await erc1155_2.balanceOf(user2.address, 3), 100);
      const beforeCreator = await ethers.provider.getBalance(owner.address);
      const before = await ethers.provider.getBalance(user2.address);

      const tx = await marketplace
        .connect(user2)
        .purchase(4, 10, { value: ethers.utils.parseUnits("20", "ether") });
      const receipt = await tx.wait();

      console.log("Gas used: ", receipt.gasUsed.toString());

      const afterCreator = await ethers.provider.getBalance(owner.address);
      const after = await ethers.provider.getBalance(user2.address);
      console.log((before - after) / 1e18);
      console.log((afterCreator - beforeCreator) / 1e18);
      assert.equal(await erc1155_2.balanceOf(user2.address, 3), 110);
      assert.isFalse(await marketplace.isOfferExist(4));
    });

    it("Success: Purchase with token without royalties", async function () {
      let offer = await marketplace.offers(5);
      assert.equal(offer.quantity, 1);
      assert.equal(await erc721_3noR.ownerOf(222), owner.address);
      const beforeCreator = await erc20_1.balanceOf(owner.address);
      const before = await erc20_1.balanceOf(user2.address);

      await erc20_1
        .connect(user2)
        .approve(marketplace.address, ethers.utils.parseUnits("10", "ether"));

      const tx = await marketplace.connect(user2).purchase(5, 1);

      const receipt = await tx.wait();

      console.log("Gas used: ", receipt.gasUsed.toString());

      const after = await erc20_1.balanceOf(user2.address);
      const afterCreator = await erc20_1.balanceOf(owner.address);

      assert.equal((before - after) / 1e18, 2);
      assert.equal((afterCreator - beforeCreator) / 1e18, "1.8");
      assert.equal(await erc721_3noR.ownerOf(222), user2.address);
    });

    it("Success: Purchase with eth without royalties", async function () {
      let offer = await marketplace.offers(6);
      assert.equal(offer.quantity, 1);
      assert.equal(await erc721_3noR.ownerOf(333), owner.address);
      const beforeCreator = await ethers.provider.getBalance(owner.address);
      const before = await ethers.provider.getBalance(user1.address);

      await marketplace
        .connect(user1)
        .purchase(6, 1, { value: ethers.utils.parseUnits("2", "ether") });
      const after = await ethers.provider.getBalance(user1.address);
      const afterCreator = await ethers.provider.getBalance(owner.address);

      console.log((before - after) / 1e18);
      console.log((afterCreator - beforeCreator) / 1e18);
      assert.equal(await erc721_3noR.ownerOf(222), user2.address);
    });
  });
  describe("Cancel", function () {
    it("Fail: You are not owner of the offer", async function () {
      await expect(marketplace.connect(user2).cancel(0)).to.be.revertedWith(
        "You are not owner of the offer."
      );
    });
    it("Success: Cancel with erc1155", async function () {
      await marketplace.connect(user1).cancel(0);
      assert.isFalse(await marketplace.isOfferExist(0));
    });

    it("Fail: Offer does not exist", async function () {
      await expect(marketplace.connect(user1).cancel(0)).to.be.revertedWith(
        "Offer does not exist."
      );
    });

    it("Success: Cancel with erc721", async function () {
      await marketplace.connect(user2).cancel(2);
      assert.isFalse(await marketplace.isOfferExist(2));
    });
  });
  describe("Unlock eth and tokens", function () {
    it("Success: Unlock eth and tokens with multical", async function () {
      const beforeETH = await ethers.provider.getBalance(owner.address);
      const beforeToken = await erc20_1.balanceOf(marketplace.address);
      const txETHData = "0xe2a99d8b";
      const txTokenData = "0xcb67f948";

      const callData = [
        txETHData +
          (await ethers.utils.defaultAbiCoder
            .encode(["address"], [owner.address])
            .slice(2)),
        txTokenData +
          (await ethers.utils.defaultAbiCoder
            .encode(["address"], [erc20_1.address])
            .slice(2)),
      ];

      await multicall.connect(user1).aggregate([
        { target: marketplace.address, callData: callData[0] },
        { target: marketplace.address, callData: callData[1] },
      ]);
      const afterETH = await ethers.provider.getBalance(owner.address);
      console.log((afterETH - beforeETH) / 1e18);
      const afterToken = await erc20_1.balanceOf(marketplace.address);
      console.log((beforeToken - afterToken) / 1e18);
    });
  });
});
