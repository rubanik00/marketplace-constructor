const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect, assert } = require("chai");
const { ethers, network, upgrades } = require("hardhat");
const { signCollectionByUser } = require("../helpers/collectionSignature");

const ownerRole = ethers.utils.id("OWNER_COLLECTIONS_ROLE");

const signerRole = ethers.utils.id("SIGNER_COLLECTIONS_ROLE");

const zeroAddress = "0x0000000000000000000000000000000000000000";
const fee = "1000";

const test721TokenName = "721Name";
const test721TokenVersion = "1";
const test721TokenSymbol = "721";
const test721TokenUri = "https://testUriDomain/721/";

const test1155TokenUri = "https://testUriDomain/1155/";
const test1155TokenName = "1155Name";
const test1155TokenVersion = "1";
const test1155TokenSymbol = "1155";

const collectionsWithSignatureName = "CollectionsWithSignature";
const collectionsVersion = "1";

const testTokens1 = [1, 2, 3, 4, 5, 6, 7];
const testTokens2 = [8, 9, 10];
const testTokens3 = testTokens1.concat(testTokens2);

describe("Collections", function () {
  async function deployStartFixture() {
    const [owner, signer, admin, creator, firstUser, secondUser] =
      await ethers.getSigners();

    const Token721 = await ethers.getContractFactory("ERC721PresetMintableURI");
    const token721 = await Token721.deploy(
      test721TokenName,
      test721TokenVersion,
      test721TokenSymbol,
      test721TokenUri
    );

    const Token1155 = await ethers.getContractFactory(
      "ERC1155PresetMintableRoyalty"
    );
    const token1155 = await Token1155.deploy(
      test1155TokenUri,
      test1155TokenName,
      test1155TokenVersion,
      test1155TokenSymbol,
      signer.address,
      fee
    );

    const CollectionsPreset = await ethers.getContractFactory(
      "CollectionsPreset"
    );
    const collections = await CollectionsPreset.deploy();

    const CollectionsPresetWithSignature = await ethers.getContractFactory(
      "CollectionsPresetWithSignature"
    );
    const collectionsWithSignature =
      await CollectionsPresetWithSignature.deploy(
        collectionsWithSignatureName,
        collectionsVersion
      );

    const CollectionsPresetUpgradeable = await ethers.getContractFactory(
      "CollectionsPresetUpgradeable"
    );
    const collectionsUpgradeable = await upgrades.deployProxy(
      CollectionsPresetUpgradeable,
      [],
      { initializer: "initialize" }
    );

    const CollectionsPresetWithSignatureUpgradeable =
      await ethers.getContractFactory(
        "CollectionsPresetWithSignatureUpgradeable"
      );
    const collectionsWithSignatureUpgradeable = await upgrades.deployProxy(
      CollectionsPresetWithSignatureUpgradeable,
      [collectionsWithSignatureName, collectionsVersion],
      { initializer: "initialize" }
    );

    const collectionDomain = {
      name: collectionsWithSignatureName,
      version: collectionsVersion,
      chainId: network.config.chainId,
      verifyingContract: collectionsWithSignature.address,
    };

    const collectionUpgradeableDomain = {
      name: collectionsWithSignatureName,
      version: collectionsVersion,
      chainId: network.config.chainId,
      verifyingContract: collectionsWithSignatureUpgradeable.address,
    };

    return {
      owner,
      signer,
      admin,
      creator,
      firstUser,
      secondUser,
      token721,
      token1155,
      collections,
      collectionsWithSignature,
      collectionsUpgradeable,
      collectionsWithSignatureUpgradeable,
      collectionDomain,
      collectionUpgradeableDomain,
    };
  }

  describe("Deployment", function () {
    const checkRoles = async (collections, owner, firstUser) => {
      expect(await collections.hasRole(ownerRole, owner.address)).to.equal(
        true
      );
      expect(await collections.hasRole(ownerRole, firstUser.address)).to.equal(
        false
      );
    };

    const checkRolesWithSignature = async (collections, owner, firstUser) => {
      await checkRoles(collections, owner, firstUser);

      expect(await collections.hasRole(signerRole, owner.address)).to.equal(
        false
      );
      expect(await collections.hasRole(signerRole, firstUser.address)).to.equal(
        false
      );
    };

    it("Deploy CollectionsPreset", async function () {
      const { collections, owner, firstUser } = await loadFixture(
        deployStartFixture
      );

      await checkRoles(collections, owner, firstUser);
    });

    it("Deploy CollectionsPresetWithSignature", async function () {
      const {
        collectionsWithSignature: collections,
        owner,
        firstUser,
      } = await loadFixture(deployStartFixture);

      await checkRolesWithSignature(collections, owner, firstUser);
    });

    it("Deploy CollectionsPresetUpgradeable", async function () {
      const {
        collectionsUpgradeable: collections,
        owner,
        firstUser,
      } = await loadFixture(deployStartFixture);

      await expect(collections.initialize()).revertedWith(
        "Initializable: contract is already initialized"
      );

      await checkRoles(collections, owner, firstUser);
    });

    it("Deploy CollectionsPresetWithSignatureUpgradeable", async function () {
      const {
        collectionsWithSignatureUpgradeable: collections,
        owner,
        firstUser,
      } = await loadFixture(deployStartFixture);

      await expect(
        collections.initialize(collectionsWithSignatureName, collectionsVersion)
      ).to.revertedWith("Initializable: contract is already initialized");

      await checkRolesWithSignature(collections, owner, firstUser);
    });
  });

  const addRole = async (collections, role, user) => {
    await collections.grantRole(role, user.address);
    expect(await collections.hasRole(role, user.address)).to.equal(true);
  };

  const createCollectionAdmin = async (collections, admin, token, tokens) => {
    const collectionCounter = await collections.collectionCounter();
    const collectionId = collectionCounter.add(1);

    await collections.connect(admin).createCollection(tokens, token.address);

    expect(await collections.collectionCounter()).to.equal(collectionId);

    const collection = await collections.collections(collectionId);
    expect(collection.creator).to.equal(admin.address);
    expect(collection.implementation).to.equal(token.address);
    const collectionTokens = await collections.getCollectionTokens(
      collectionId
    );
    assert.equal(collectionTokens.toString(), tokens.toString());
  };

  const createCollectionSignature = async (
    collections,
    signer,
    tokens,
    implementation,
    user,
    domain
  ) => {
    const collectionCounter = await collections.collectionCounter();
    const collectionId = collectionCounter.add(1);

    const signature = await signCollectionByUser(
      signer,
      domain,
      tokens,
      implementation.address,
      user.address
    );

    await collections
      .connect(user)
      ["createCollection(uint256[],address,uint8,bytes32,bytes32)"](
        tokens,
        implementation.address,
        signature.v,
        signature.r,
        signature.s
      );

    expect(await collections.collectionCounter()).to.equal(collectionId);

    const collection = await collections.collections(collectionId);
    expect(collection.creator).to.equal(user.address);
    expect(collection.implementation).to.equal(implementation.address);
    const collectionTokens = await collections.getCollectionTokens(
      collectionId
    );
    assert.equal(collectionTokens.toString(), tokens.toString());
  };

  describe("Create Collection", function () {
    describe("Default collection", function () {
      it("Should be possible to create new collection by admin with valid tokens", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);
      });

      it("Should be NOT possible to create new collection by admin with NOT valid tokens", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await expect(
          collections.connect(admin).createCollection([1, 1], token721.address)
        ).to.revertedWith("Tokens contain same values");
        await expect(
          collections
            .connect(admin)
            .createCollection([3, 5, 7, 7], token1155.address)
        ).to.revertedWith("Tokens contain same values");
      });

      it("Should be NOT possible to create new collection by NOT admin", async function () {
        const { collections, token721, token1155, admin } = await loadFixture(
          deployStartFixture
        );

        expect(await collections.hasRole(ownerRole, admin.address)).to.equal(
          false
        );

        await expect(
          collections
            .connect(admin)
            .createCollection(testTokens1, token721.address)
        ).to.revertedWith(
          `AccessControl: account ${admin.address.toLowerCase()} is missing role ${ownerRole}`
        );
        await expect(
          collections
            .connect(admin)
            .createCollection(testTokens1, token1155.address)
        ).to.revertedWith(
          `AccessControl: account ${admin.address.toLowerCase()} is missing role ${ownerRole}`
        );
      });
    });
    describe("Upgradeable collection", function () {
      it("Should be possible to create new collection by admin with valid tokens", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);
      });

      it("Should be NOT possible to create new collection by admin with NOT valid tokens", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await expect(
          collections.connect(admin).createCollection([1, 1], token721.address)
        ).to.revertedWith("Tokens contain same values");
        await expect(
          collections
            .connect(admin)
            .createCollection([3, 5, 7, 7], token1155.address)
        ).to.revertedWith("Tokens contain same values");
      });

      it("Should be NOT possible to create new collection by NOT admin", async function () {
        const {
          collectionsUpgradeable: collections,
          token721,
          token1155,
          owner,
          admin,
        } = await loadFixture(deployStartFixture);

        expect(await collections.hasRole(ownerRole, admin.address)).to.equal(
          false
        );

        await expect(
          collections
            .connect(admin)
            .createCollection(testTokens1, token721.address)
        ).to.revertedWith(
          `AccessControl: account ${admin.address.toLowerCase()} is missing role ${ownerRole}`
        );
        await expect(
          collections
            .connect(admin)
            .createCollection(testTokens1, token1155.address)
        ).to.revertedWith(
          `AccessControl: account ${admin.address.toLowerCase()} is missing role ${ownerRole}`
        );
      });
    });

    describe("Default collection with signature", function () {
      it("Should be possible to create new collection by user with valid signature", async function () {
        const {
          collectionsWithSignature: collections,
          collectionDomain,
          signer,
          firstUser,
          secondUser,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, signerRole, signer);

        await createCollectionSignature(
          collections,
          signer,
          testTokens1,
          token721,
          firstUser,
          collectionDomain
        );
        await createCollectionSignature(
          collections,
          signer,
          testTokens2,
          token1155,
          secondUser,
          collectionDomain
        );
      });

      it("Should be NOT possible to create new collection by user with NOT valid signature", async function () {
        const {
          collectionsWithSignature: collections,
          collectionDomain,
          signer,
          firstUser,
          secondUser,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, signerRole, signer);

        const signature1 = await signCollectionByUser(
          signer,
          collectionDomain,
          testTokens1,
          token721.address,
          firstUser.address
        );

        await expect(
          collections
            .connect(firstUser)
            ["createCollection(uint256[],address,uint8,bytes32,bytes32)"](
              testTokens2,
              token721.address,
              signature1.v,
              signature1.r,
              signature1.s
            )
        ).to.revertedWith("SignedAdmin should sign tokenId");

        const signature2 = await signCollectionByUser(
          signer,
          collectionDomain,
          testTokens1,
          token1155.address,
          firstUser.address
        );

        await expect(
          collections
            .connect(secondUser)
            ["createCollection(uint256[],address,uint8,bytes32,bytes32)"](
              testTokens1,
              token1155.address,
              signature2.v,
              signature2.r,
              signature2.s
            )
        ).to.revertedWith("SignedAdmin should sign tokenId");
      });

      it("Should be NOT possible to create new collection by user with NOT valid signer", async function () {
        const {
          collectionsWithSignature: collections,
          collectionDomain,
          signer,
          firstUser,
          secondUser,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        const signature1 = await signCollectionByUser(
          signer,
          collectionDomain,
          testTokens1,
          token721.address,
          firstUser.address
        );

        await expect(
          collections
            .connect(firstUser)
            ["createCollection(uint256[],address,uint8,bytes32,bytes32)"](
              testTokens1,
              token721.address,
              signature1.v,
              signature1.r,
              signature1.s
            )
        ).to.revertedWith("SignedAdmin should sign tokenId");

        const signature2 = await signCollectionByUser(
          signer,
          collectionDomain,
          testTokens1,
          token1155.address,
          secondUser.address
        );

        await expect(
          collections
            .connect(secondUser)
            ["createCollection(uint256[],address,uint8,bytes32,bytes32)"](
              testTokens1,
              token1155.address,
              signature2.v,
              signature2.r,
              signature2.s
            )
        ).to.revertedWith("SignedAdmin should sign tokenId");
      });
    });
  });

  describe("Remove Collection", function () {
    describe("Default collection", function () {
      it("Should be possible to remove collection by creator", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await collections.connect(admin).removeCollection(1);
        await collections.connect(admin).removeCollection(2);

        const collection1 = await collections.collections(1);
        const collection2 = await collections.collections(2);

        expect(collection1.implementation).to.be.equal(zeroAddress);
        expect(collection1.creator).to.be.equal(zeroAddress);
        expect(collection2.implementation).to.be.equal(zeroAddress);
        expect(collection2.creator).to.be.equal(zeroAddress);
      });

      it("Should be NOT possible to remove collection by NOT creator", async function () {
        const { collections, admin, owner, token721, token1155 } =
          await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await expect(
          collections.connect(owner).removeCollection(1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).removeCollection(2)
        ).to.revertedWith("Only creator can do action with collection");
      });
    });

    describe("Upgradeable collection", function () {
      it("Should be possible to remove collection by creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await collections.connect(admin).removeCollection(1);
        await collections.connect(admin).removeCollection(2);

        const collection1 = await collections.collections(1);
        const collection2 = await collections.collections(2);

        expect(collection1.implementation).to.be.equal(zeroAddress);
        expect(collection1.creator).to.be.equal(zeroAddress);
        expect(collection2.implementation).to.be.equal(zeroAddress);
        expect(collection2.creator).to.be.equal(zeroAddress);
      });

      it("Should be NOT possible to remove collection by NOT creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          owner,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await expect(
          collections.connect(owner).removeCollection(1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).removeCollection(2)
        ).to.revertedWith("Only creator can do action with collection");
      });
    });
  });

  const addTokensToCollection = async (
    collections,
    collectionId,
    user,
    tokens
  ) => {
    const tokensBefore = await collections.getCollectionTokens(collectionId);

    await collections.connect(user).addTokensToCollection(collectionId, tokens);

    const collectionTokens = await collections.getCollectionTokens(
      collectionId
    );
    const tokensBeforeMap = tokensBefore.concat(
      tokens.map((token) => ethers.BigNumber.from(token))
    );

    assert.equal(collectionTokens.toString(), tokensBeforeMap.toString());
  };

  describe("Add Tokens To Collection", function () {
    describe("Default collection", function () {
      it("Should be possible to add valid tokens to collection by creator", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await addTokensToCollection(collections, 1, admin, testTokens1);
        await addTokensToCollection(collections, 2, admin, testTokens2);
      });

      it("Should be NOT possible to add valid tokens to collection by NOT creator", async function () {
        const { collections, admin, owner, token721, token1155 } =
          await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await expect(
          collections.connect(owner).addTokensToCollection(1, testTokens1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).addTokensToCollection(2, testTokens2)
        ).to.revertedWith("Only creator can do action with collection");
      });

      it("Should be NOT possible to add NOT valid tokens to collection by creator", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await expect(
          collections.connect(admin).addTokensToCollection(1, testTokens3)
        ).to.revertedWith("Impossible add this tokens to collection");
        await expect(
          collections.connect(admin).addTokensToCollection(2, testTokens3)
        ).to.revertedWith("Impossible add this tokens to collection");
      });
    });

    describe("Upgradeable collection", function () {
      it("Should be possible to add valid tokens to collection by creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await addTokensToCollection(collections, 1, admin, testTokens1);
        await addTokensToCollection(collections, 2, admin, testTokens2);
      });

      it("Should be NOT possible to add valid tokens to collection by NOT creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          owner,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, []);
        await createCollectionAdmin(collections, admin, token1155, testTokens1);

        await expect(
          collections.connect(owner).addTokensToCollection(1, testTokens1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).addTokensToCollection(2, testTokens2)
        ).to.revertedWith("Only creator can do action with collection");
      });

      it("Should be NOT possible to add NOT valid tokens to collection by creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await expect(
          collections.connect(admin).addTokensToCollection(1, testTokens3)
        ).to.revertedWith("Impossible add this tokens to collection");
        await expect(
          collections.connect(admin).addTokensToCollection(2, testTokens3)
        ).to.revertedWith("Impossible add this tokens to collection");
      });
    });
  });

  const removeTokensFromCollection = async (
    collections,
    collectionId,
    user,
    tokens
  ) => {
    const tokensBefore = (
      await collections.getCollectionTokens(collectionId)
    ).map((token) => token.toNumber());

    await collections
      .connect(user)
      .removeTokensFromCollection(collectionId, tokens);

    const tokensAfter = (await collections.getCollectionTokens(collectionId))
      .map((token) => token.toNumber())
      .sort();

    expect(tokensAfter).to.deep.equal(
      tokensBefore.filter((token) => !tokens.includes(token)).sort()
    );
  };

  describe("Remove Tokens From Collection", function () {
    describe("Default collection", function () {
      it("Should be possible to remove valid tokens from collection by creator", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens3);
        await createCollectionAdmin(collections, admin, token1155, testTokens3);

        await removeTokensFromCollection(collections, 1, admin, testTokens1);
        await removeTokensFromCollection(collections, 2, admin, testTokens2);
      });

      it("Should be NOT possible to add valid tokens to collection by NOT creator", async function () {
        const { collections, admin, owner, token721, token1155 } =
          await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens3);
        await createCollectionAdmin(collections, admin, token1155, testTokens3);

        await expect(
          collections.connect(owner).removeTokensFromCollection(1, testTokens1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).removeTokensFromCollection(2, testTokens2)
        ).to.revertedWith("Only creator can do action with collection");
      });

      it("Should be NOT possible to add NOT valid tokens to collection by creator", async function () {
        const { collections, admin, token721, token1155 } = await loadFixture(
          deployStartFixture
        );

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await expect(
          collections.connect(admin).removeTokensFromCollection(1, testTokens3)
        ).to.revertedWith("Impossible remove this tokens from collection");
        await expect(
          collections.connect(admin).removeTokensFromCollection(2, testTokens3)
        ).to.revertedWith("Impossible remove this tokens from collection");
      });
    });

    describe("Upgradeable collection", function () {
      it("Should be possible to remove valid tokens from collection by creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens3);
        await createCollectionAdmin(collections, admin, token1155, testTokens3);

        await removeTokensFromCollection(collections, 1, admin, testTokens1);
        await removeTokensFromCollection(collections, 2, admin, testTokens2);
      });

      it("Should be NOT possible to add valid tokens to collection by NOT creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          owner,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens3);
        await createCollectionAdmin(collections, admin, token1155, testTokens3);

        await expect(
          collections.connect(owner).removeTokensFromCollection(1, testTokens1)
        ).to.revertedWith("Only creator can do action with collection");
        await expect(
          collections.connect(owner).removeTokensFromCollection(2, testTokens2)
        ).to.revertedWith("Only creator can do action with collection");
      });

      it("Should be NOT possible to add NOT valid tokens to collection by creator", async function () {
        const {
          collectionsUpgradeable: collections,
          admin,
          token721,
          token1155,
        } = await loadFixture(deployStartFixture);

        await addRole(collections, ownerRole, admin);

        await createCollectionAdmin(collections, admin, token721, testTokens1);
        await createCollectionAdmin(collections, admin, token1155, testTokens2);

        await expect(
          collections.connect(admin).removeTokensFromCollection(1, testTokens3)
        ).to.revertedWith("Impossible remove this tokens from collection");
        await expect(
          collections.connect(admin).removeTokensFromCollection(2, testTokens3)
        ).to.revertedWith("Impossible remove this tokens from collection");
      });
    });
  });
});
