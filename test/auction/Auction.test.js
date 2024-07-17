const { expect, assert, use } = require("chai");
const { ethers } = require("hardhat");

const metadata = "https://token-cdn-domain/";
const AUCTION = ethers.utils.id("OWNER_AUCTION_ROLE");
let accounts;
let owner;
let user1;
let user2;
let auction;
let erc20_1, erc20_2, erc20_3;
let erc1155_1, erc1155_2, erc1155_3;
let erc721_1, erc721_2;
let multicall;
let withoutFallback;

describe("Auction", function () {
  before("deploy", async function () {
    accounts = await ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];

    const Auction = await ethers.getContractFactory("Auction");
    auction = await Auction.connect(owner).deploy();
    await auction.deployed();
    await auction.connect(owner).init();

    const WithoutFallback = await ethers.getContractFactory("WithoutFallback");
    withoutFallback = await WithoutFallback.connect(owner).deploy(
      auction.address
    );
    await withoutFallback.deployed();

    const Multicall = await ethers.getContractFactory("Multicall");
    multicall = await Multicall.connect(user1).deploy();
    await multicall.deployed();

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

    await auction.grantRole(AUCTION, multicall.address);
  });
  describe("Admin Functions", function () {
    describe("Whitelist", function () {
      it("Fail: add token to whitelist by user", async function () {
        await expect(
          auction.connect(user1).addPaymentToken(erc20_1.address)
        ).to.be.revertedWith("Caller is not an owner");
      });
      it("Success: add token to whitelist by owner", async function () {
        await auction.connect(owner).addPaymentToken(erc20_1.address);
        assert.isTrue(await auction.whitelistedPaymentTokens(erc20_1.address));
      });

      it("Fail: remove token from whitelist by user", async function () {
        await expect(
          auction.connect(user1).removePaymentToken(erc20_1.address)
        ).to.be.revertedWith("Caller is not an owner");
      });

      it("Success: remove token from whitelist by owner", async function () {
        await auction.connect(owner).removePaymentToken(erc20_1.address);
        assert.isFalse(await auction.whitelistedPaymentTokens(erc20_1.address));
      });
    });
    describe("Set Fee and Set Min Delta", function () {
      it("Fail: set new fee by user", async function () {
        await expect(auction.connect(user1).setFee(1000)).to.be.revertedWith(
          "Caller is not an owner"
        );
      });
      it("Fail: set new fee larger than max fee by owner", async function () {
        await expect(auction.connect(owner).setFee(100000)).to.be.revertedWith(
          "Fee can't be grater that MAX_FEE"
        );
      });

      it("Success: set new fee by owner", async function () {
        await auction.connect(owner).setFee(1500);
        assert(await auction.fee(), "1500");
      });

      it("Fail: set new minDelta by user", async function () {
        await expect(
          auction.connect(user1).setMinDelta(1000)
        ).to.be.revertedWith("Caller is not an owner");
      });

      it("Success: set new minDelta by owner", async function () {
        await auction
          .connect(owner)
          .setMinDelta(ethers.utils.parseUnits("0.1", "ether"));
        assert(
          await auction.minDelta(),
          ethers.utils.parseUnits("0.1", "ether")
        );
      });
    });
  });
  describe("User Functions", function () {
    describe("Create Lot", function () {
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
        await erc721_1.connect(user2).mint(metadata, 2);
        await erc721_1.connect(user1).mint(metadata, 3);
        await erc721_1.connect(user1).mint(metadata, 4);

        await erc721_2.connect(owner).mint(metadata, 101);

        await auction.connect(owner).addPaymentToken(erc20_1.address);
        assert.isTrue(await auction.whitelistedPaymentTokens(erc20_1.address));
      });
      it("Fail: try to create new lot with not whitelisted token", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_2.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              432000,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Not whitelisted payment token");
      });
      it("Fail: try to create new lot with to low delta", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              432000,
              ethers.utils.parseUnits("0.01", "ether")
            )
        ).to.be.revertedWith("To low delta value");
      });
      it("Fail: try to create new lot with zero amount", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              0,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              432000,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Amount should be positive");
      });
      it("Fail: try to create new with zero start time", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              0,
              0,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Start time must be > zero");
      });
      it("Fail: try to create new with the same time", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              259200,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Wrong auction ending date");
      });
      it("Fail: try to create new lot with the incorrect time", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              432000,
              259200,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Wrong auction ending date");
      });
      it("Fail: try to create new lot without approval (1155)", async function () {
        await expect(
          auction
            .connect(user1)
            .addAuctionLot(
              erc1155_1.address,
              1,
              5,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              432000,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Token is not approved");
      });
      it("Fail: try to create new lot without approval (721)", async function () {
        await expect(
          auction
            .connect(user2)
            .addAuctionLot(
              erc721_1.address,
              1,
              1,
              erc20_1.address,
              ethers.utils.parseUnits("10", "ether"),
              ethers.utils.parseUnits("1", "ether"),
              259200,
              432000,
              ethers.utils.parseUnits("0.1", "ether")
            )
        ).to.be.revertedWith("Not approved token");
      });
      it("Success: create new lot by user (1155)", async function () {
        assert.equal(await erc1155_1.balanceOf(user1.address, 1), 100);
        await erc1155_1.connect(user1).setApprovalForAll(auction.address, true);
        await auction
          .connect(user1)
          .addAuctionLot(
            erc1155_1.address,
            1,
            5,
            erc20_1.address,
            ethers.utils.parseUnits("10", "ether"),
            ethers.utils.parseUnits("1", "ether"),
            259200,
            432000,
            ethers.utils.parseUnits("0.1", "ether")
          );

        assert.equal(await auction.getCreator(0), user1.address);
        assert.equal(await erc1155_1.balanceOf(user1.address, 1), 100);
      });
      it("Success: create new lot by user (721)", async function () {
        assert.equal(await erc721_1.ownerOf(1), user2.address);
        await erc721_1.connect(user2).setApprovalForAll(auction.address, true);
        await auction
          .connect(user2)
          .addAuctionLot(
            erc721_1.address,
            1,
            1,
            ethers.constants.AddressZero,
            ethers.utils.parseUnits("10", "ether"),
            ethers.utils.parseUnits("1", "ether"),
            259200,
            432000,
            ethers.utils.parseUnits("0.1", "ether")
          );

        assert.equal(await auction.getCreator(1), user2.address);
        assert.equal(await erc721_1.ownerOf(1), user2.address);
      });
    });
    describe("Edit Lot", function () {
      before("create lot", async function () {
        await erc721_2.connect(owner).setApprovalForAll(auction.address, true);

        await auction
          .connect(owner)
          .addAuctionLot(
            erc721_2.address,
            101,
            1,
            ethers.constants.AddressZero,
            ethers.utils.parseUnits("10", "ether"),
            ethers.utils.parseUnits("1", "ether"),
            1,
            259200,
            ethers.utils.parseUnits("0.1", "ether")
          );
      });
      it("Fail: try to edit when lot already started", async function () {
        await ethers.provider.send("evm_increaseTime", [200]);
        await ethers.provider.send("evm_mine", []);

        const auctionInfo = await auction.getAuctionInfo(2);

        const buyNowPrice = ethers.utils.parseUnits("11", "ether");
        const startPrice = ethers.utils.parseUnits("2", "ether");
        const startTime = parseInt(auctionInfo.startTime) + 200;
        const endTime = auctionInfo.endTime;
        const delta = ethers.utils.parseUnits("0.1", "ether");

        await expect(
          auction
            .connect(owner)
            .editAuctionLot(
              2,
              buyNowPrice,
              startPrice,
              startTime,
              endTime,
              delta
            )
        ).to.be.revertedWith("Auction started");
      });
      it("Fail: try to edit when delta < minDelta", async function () {
        const auctionInfo = await auction.getAuctionInfo(0);
        const buyNowPrice = ethers.utils.parseUnits("11", "ether");
        const startPrice = ethers.utils.parseUnits("2", "ether");
        const startTime = auctionInfo.startTime;
        const endTime = auctionInfo.endTime;
        const delta = ethers.utils.parseUnits("0.002", "ether");

        await expect(
          auction
            .connect(user1)
            .editAuctionLot(
              0,
              buyNowPrice,
              startPrice,
              startTime,
              endTime,
              delta
            )
        ).to.be.revertedWith("To low delta value");
      });
      it("Fail: try to edit lot by not lot owner", async function () {
        const auctionInfo = await auction.getAuctionInfo(0);
        const buyNowPrice = ethers.utils.parseUnits("11", "ether");
        const startPrice = ethers.utils.parseUnits("2", "ether");
        const startTime = auctionInfo.startTime;
        const endTime = auctionInfo.endTime;
        const delta = ethers.utils.parseUnits("0.2", "ether");

        await expect(
          auction
            .connect(user2)
            .editAuctionLot(
              0,
              buyNowPrice,
              startPrice,
              startTime,
              endTime,
              delta
            )
        ).to.be.revertedWith("Not creator of auction");
      });
      it("Success: edit lot", async function () {
        let auctionInfo = await auction.getAuctionInfo(0);
        const buyNowPrice = ethers.utils.parseUnits("11", "ether");
        const startPrice = ethers.utils.parseUnits("2", "ether");
        const startTime = parseInt(auctionInfo.startTime) + 259200;
        const endTime = parseInt(auctionInfo.endTime) + 432000;
        const delta = ethers.utils.parseUnits("0.2", "ether");

        await auction
          .connect(user1)
          .editAuctionLot(
            0,
            buyNowPrice,
            startPrice,
            startTime,
            endTime,
            delta
          );
        auctionInfo = await auction.getAuctionInfo(0);
        assert.equal(auctionInfo.buyNowPrice.toString(), buyNowPrice);
        assert.equal(auctionInfo.startPrice.toString(), startPrice);
        assert.equal(auctionInfo.startTime.toString(), startTime);
        assert.equal(auctionInfo.endTime.toString(), endTime);
        assert.equal(auctionInfo.delta.toString(), delta);
      });
      it("Fail: extendActionLifeTime by not lot owner", async function () {
        let auctionInfo = await auction.getAuctionInfo(1);
        const newEndTime = parseInt(auctionInfo.endTime) + 432000;
        await expect(
          auction.connect(user1).extendActionLifeTime(1, newEndTime)
        ).to.be.revertedWith("Not creator of auction");
      });
      it("Fail: extendActionLifeTime by not lot owner", async function () {
        let auctionInfo = await auction.getAuctionInfo(1);
        const newEndTime = parseInt(auctionInfo.endTime) + 433000;
        await expect(
          auction.connect(user1).extendActionLifeTime(0, newEndTime)
        ).to.be.revertedWith("Already extended");
      });
      it("Fail: extendActionLifeTime for more than 30 days", async function () {
        let auctionInfo = await auction.getAuctionInfo(1);
        const newEndTime = parseInt(auctionInfo.endTime) + 3024000;
        await expect(
          auction.connect(user2).extendActionLifeTime(1, newEndTime)
        ).to.be.revertedWith("Could extend only for 30 days");
      });
      it("Success: extendActionLifeTime", async function () {
        let auctionInfo = await auction.getAuctionInfo(1);
        const newEndTime = parseInt(auctionInfo.endTime) + 864000;
        await auction.connect(user2).extendActionLifeTime(1, newEndTime);
        auctionInfo = await auction.getAuctionInfo(1);
        assert.equal(auctionInfo.endTime.toString(), newEndTime);
      });
      it("Fail: extendActionLifeTime when auction finished", async function () {
        await ethers.provider.send("evm_increaseTime", [200000000]);
        await ethers.provider.send("evm_mine", []);
        const auctionInfo = await auction.getAuctionInfo(2);
        const newEndTime = parseInt(auctionInfo.endTime) + 864000;

        await expect(
          auction.connect(owner).extendActionLifeTime(2, newEndTime)
        ).to.be.revertedWith("Auction finished");
      });
    });
  });
  describe("add Bid", function () {
    before("Create lots", async function () {
      await erc721_1.connect(user2).setApprovalForAll(auction.address, true);

      await auction
        .connect(user2)
        .addAuctionLot(
          erc721_1.address,
          2,
          1,
          ethers.constants.AddressZero,
          ethers.utils.parseUnits("10", "ether"),
          ethers.utils.parseUnits("1", "ether"),
          1,
          259200,
          ethers.utils.parseUnits("0.1", "ether")
        );

      await auction
        .connect(user1)
        .addAuctionLot(
          erc1155_1.address,
          5,
          15,
          erc20_1.address,
          ethers.utils.parseUnits("10", "ether"),
          ethers.utils.parseUnits("1", "ether"),
          1,
          259200,
          ethers.utils.parseUnits("0.1", "ether")
        );
    });
    it("Fail: Auction does not exist", async function () {
      await expect(
        auction
          .connect(user1)
          .addBid(5, ethers.utils.parseUnits("1.15", "ether"), {
            value: ethers.utils.parseUnits("1.15", "ether"),
          })
      ).to.be.revertedWith("Auction does not exist");
    });
    it("Fail: Owner cannot add bid", async function () {
      await expect(
        auction
          .connect(user2)
          .addBid(3, ethers.utils.parseUnits("1.15", "ether"), {
            value: ethers.utils.parseUnits("1.15", "ether"),
          })
      ).to.be.revertedWith("Owner cannot add bid");
    });
    it("Fail: Wrong msg.value", async function () {
      await expect(
        auction
          .connect(user1)
          .addBid(3, ethers.utils.parseUnits("1.15", "ether"), {
            value: ethers.utils.parseUnits("1", "ether"),
          })
      ).to.be.revertedWith("Wrong msg.value");
    });
    it("Fail: Should be bigger than startPrice", async function () {
      await expect(
        auction
          .connect(user1)
          .addBid(3, ethers.utils.parseUnits("0.15", "ether"), {
            value: ethers.utils.parseUnits("0.15", "ether"),
          })
      ).to.be.revertedWith("Should be bigger than startPrice");
    });
    it("Success: add Bid", async function () {
      await auction
        .connect(owner)
        .addBid(3, ethers.utils.parseUnits("1.05", "ether"), {
          value: ethers.utils.parseUnits("1.05", "ether"),
        });
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await auction
        .connect(user1)
        .addBid(3, ethers.utils.parseUnits("1.15", "ether"), {
          value: ethers.utils.parseUnits("1.15", "ether"),
        });
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      console.log((balanceAfter - balanceBefore) / 1e18); // 1.0499
    });
    it("Success: add Bid with pending payment", async function () {
      await withoutFallback
        .connect(owner)
        .callAddBid(3, ethers.utils.parseUnits("1.25", "ether"), {
          value: ethers.utils.parseUnits("1.25", "ether"),
        });

      let res = await auction.pendingPayments(withoutFallback.address, 3);
      assert.equal(res.toString(), "0");

      await auction
        .connect(user1)
        .addBid(3, ethers.utils.parseUnits("1.35", "ether"), {
          value: ethers.utils.parseUnits("1.35", "ether"),
        });

      res = await auction.pendingPayments(withoutFallback.address, 3);
      assert.equal(res.toString(), "1250000000000000000");
      const bidInfo = await auction.getBidInfo(3);
      assert.equal(bidInfo[0], user1.address);
      assert.equal(
        bidInfo[1].toString(),
        ethers.utils.parseUnits("1.35", "ether")
      );
    });
    it("Success: add Bid with erc20 payment Token", async function () {
      const balanceBefore = await erc20_1.balanceOf(user2.address);
      await erc20_1
        .connect(user2)
        .approve(auction.address, ethers.utils.parseUnits("50", "ether"));
      await auction
        .connect(user2)
        .addBid(0, ethers.utils.parseUnits("2", "ether"));

      const balanceAfter = await erc20_1.balanceOf(user2.address);
      assert.equal(
        balanceBefore - balanceAfter,
        ethers.utils.parseUnits("2", "ether")
      );
    });
    it("Success: add Bid with erc20 payment Token by owner address", async function () {
      const balanceBefore = await erc20_1.balanceOf(user2.address);
      await erc20_1
        .connect(owner)
        .approve(auction.address, ethers.utils.parseUnits("50", "ether"));
      await auction
        .connect(owner)
        .addBid(0, ethers.utils.parseUnits("3", "ether"));

      const balanceAfter = await erc20_1.balanceOf(user2.address);
      assert.equal(
        balanceAfter - balanceBefore,
        ethers.utils.parseUnits("2", "ether")
      );
    });
    it("Success: payout Pending Payments", async function () {
      const balanceBefore = await ethers.provider.getBalance(owner.address);
      await auction
        .connect(owner)
        .payoutPendingPayments(3, withoutFallback.address, owner.address);
      const balanceAfter = await ethers.provider.getBalance(owner.address);
      console.log((balanceAfter - balanceBefore) / 1e18); // 1.2499
    });
    it("Fail: Should be bigger than previous", async function () {
      await expect(
        auction
          .connect(owner)
          .addBid(3, ethers.utils.parseUnits("1.16", "ether"), {
            value: ethers.utils.parseUnits("1.16", "ether"),
          })
      ).to.be.revertedWith("Should be bigger than previous");
    });
    it("Fail: Cannot be more than fixed price", async function () {
      await expect(
        auction
          .connect(owner)
          .addBid(3, ethers.utils.parseUnits("40.15", "ether"), {
            value: ethers.utils.parseUnits("40.15", "ether"),
          })
      ).to.be.revertedWith("Cannot be more than fixed price");
    });
    it("Success: add Bid", async function () {
      await auction
        .connect(owner)
        .addBid(3, ethers.utils.parseUnits("10", "ether"), {
          value: ethers.utils.parseUnits("10", "ether"),
        });
    });
    it("Fail: Try to bit one more time", async function () {
      await expect(
        auction
          .connect(owner)
          .addBid(3, ethers.utils.parseUnits("9", "ether"), {
            value: ethers.utils.parseUnits("9", "ether"),
          })
      ).to.be.revertedWith("Last bidder cannot add bid again");
    });
    it("Fail: Try to bit more than Fixed price", async function () {
      await expect(
        auction
          .connect(user1)
          .addBid(3, ethers.utils.parseUnits("10.15", "ether"), {
            value: ethers.utils.parseUnits("10.15", "ether"),
          })
      ).to.be.revertedWith("Cannot be more than fixed price");
    });
  });
  describe("Claims/Delete", function () {
    before("create lot", async function () {
      await erc721_1.connect(user1).setApprovalForAll(auction.address, true);

      await auction
        .connect(user1)
        .addAuctionLot(
          erc721_1.address,
          3,
          1,
          ethers.constants.AddressZero,
          ethers.utils.parseUnits("10", "ether"),
          ethers.utils.parseUnits("1", "ether"),
          1,
          259200,
          ethers.utils.parseUnits("0.1", "ether")
        );

      await auction
        .connect(user1)
        .addAuctionLot(
          erc721_1.address,
          4,
          1,
          ethers.constants.AddressZero,
          ethers.utils.parseUnits("10", "ether"),
          ethers.utils.parseUnits("1", "ether"),
          1,
          259200,
          ethers.utils.parseUnits("0.1", "ether")
        );
    });

    it("Fail: Delete by not lot owner", async function () {
      await expect(auction.connect(owner).delAuctionLot(4)).to.be.revertedWith(
        "Not creator of auction"
      );
    });
    it("Fail: Delete when lot started", async function () {
      await auction
        .connect(owner)
        .addBid(5, ethers.utils.parseUnits("1.05", "ether"), {
          value: ethers.utils.parseUnits("1.05", "ether"),
        });

      await expect(auction.connect(user1).delAuctionLot(5)).to.be.revertedWith(
        "Auction started"
      );
    });
    it("Success: Delete lot", async function () {
      await auction.connect(user1).delAuctionLot(6);
    });

    it("Fail: Claim lot by winner without msg.value", async function () {
      await expect(auction.connect(owner).claimLot(3)).to.be.revertedWith(
        "Value must be equal to 1000000000000000000 (royalty fee)"
      );
    });

    it("Fail: Claim lot by winner when creator have no auction lot token on the balance", async function () {
      await erc721_1
        .connect(user2)
        .transferFrom(user2.address, owner.address, 2);

      await expect(
        auction
          .connect(owner)
          .claimLot(3, { value: ethers.utils.parseUnits("1", "ether") })
      ).to.be.revertedWith("ERC721: caller is not token owner nor approved");

      await erc721_1
        .connect(owner)
        .transferFrom(owner.address, user2.address, 2);

      await erc721_1.connect(user2).setApprovalForAll(auction.address, true);
    });
    it("Success: Claim lot by winner", async function () {
      const balanceBefore = await ethers.provider.getBalance(user1.address);
      await auction
        .connect(owner)
        .claimLot(3, { value: ethers.utils.parseUnits("1", "ether") });
      assert.equal(await erc721_1.ownerOf(2), owner.address);
      const balanceAfter = await ethers.provider.getBalance(user1.address);
      console.log((balanceAfter - balanceBefore) / 1e18); // 1
    });
    it("Success: Claim fee and set new fee with Multicall", async function () {
      const before = await ethers.provider.getBalance(owner.address);
      const txSetFeeData = "0x69fe0e2d";

      const txClaimData = "0x217dcb45";
      const callData = [
        txClaimData +
          (await ethers.utils.defaultAbiCoder
            .encode(
              ["address", "address"],
              [ethers.constants.AddressZero, owner.address]
            )
            .slice(2)),
        txSetFeeData +
          (await ethers.utils.defaultAbiCoder
            .encode(["uint256"], [1000])
            .slice(2)),
      ];

      await multicall.connect(user1).aggregate([
        { target: auction.address, callData: callData[0] },
        { target: auction.address, callData: callData[1] },
      ]);

      const after = await ethers.provider.getBalance(owner.address);
      console.log((after - before) / 1e18);
      assert(await auction.fee(), "1000");
    });
  });
});
