// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./MarketplaceWhitelistERC20.sol";
import "./MarketplaceSignature.sol";
import "./Payout2981Support.sol";

import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC721/utils/ERC721Holder.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC721.sol";
import "@openzeppelin/contracts/interfaces/IERC1155.sol";

// @title Marketplace Contract without fee logic extension
// @notice standart Marketplace function without platform fee.

contract MarketplaceLotLogicWithoutFee is
    Payout2981Support,
    MarketplaceWhitelistERC20,
    MarketplaceSignature,
    AccessControlEnumerable,
    ReentrancyGuard,
    ERC1155Holder,
    ERC721Holder
{
    using SafeERC20 for IERC20;
    using Counters for Counters.Counter;

    bytes32 public constant OWNER_MARKETPLACE_ROLE =
        keccak256("OWNER_MARKETPLACE_ROLE");

    struct OfferData {
        uint256 tokenId;
        uint256 price;
        uint256 quantity;
        address creator;
        address token;
        address saleToken;
        bool tokenType;
    }

    mapping(uint256 => OfferData) public offers;
    mapping(address => uint256) private accountNonce; // user => nonceCouner;

    Counters.Counter internal _offersCounter;

    event CreatedOffer(
        uint256 offerId,
        bool tokenType,
        address user,
        address token,
        uint256 tokenId,
        uint256 quantity,
        address saleToken,
        uint256 price
    );
    event Purchased(address buyer, uint256 offerId, uint256 quantity);
    event OfferCanceled(address creator, uint256 offerId);
    event EditOffer(
        uint256 offerId,
        uint256 quantity,
        uint256 price,
        address saleToken
    );

    /// @dev Check if caller is contract owner

    modifier onlyOwner() {
        require(
            hasRole(OWNER_MARKETPLACE_ROLE, msg.sender),
            "Caller is not an owner."
        );
        _;
    }

    receive() external payable {}

    fallback() external payable {}

    /// @param _name vame for signature
    /// @param _version version for signature
    constructor(string memory _name, string memory _version) {
        __Signature_init(_name, _version);
    }

    /// @dev Add erc-20 token to whitelist
    /// @param tokens - array of tokens that will be added to the whitelist

    function addTokensToWhitelist(address[] memory tokens) external onlyOwner {
        _addTokensToWhitelist(tokens);
    }

    /// @dev Remove erc-20 token from whitelist
    /// @param tokens - array of tokens that will be removed from the whitelist

    function removeTokensFromWhitelist(
        address[] memory tokens
    ) external onlyOwner {
        _removeTokensFromWhitelist(tokens);
    }

    /// @dev Create offer by owner
    /// @notice Function for creating new offer on Marketplace only by owner (without fee and backend signature).
    /// @notice only for account with owner role
    /// @param token - NFT token addres which will be exhibited
    /// @param tokenId - NFT token id
    /// @param quantity - quantity of NFT token (if NFT token is ERC1155)
    /// @param saleToken - token address for which will be sold
    /// @param price - sale price in token decimals.
    /// @param tokenType - false for ERC721 OR true for ERC1155

    function createInternalOffer(
        address token,
        uint256 tokenId,
        uint256 quantity,
        address saleToken,
        uint256 price,
        bool tokenType
    ) external onlyOwner nonReentrant {
        _createOffer(token, tokenId, quantity, price, saleToken, tokenType);
    }

    /// @dev Create offer by user
    /// @notice Function for creating new offer on Marketplace only with backend sign (V,R,S).
    /// @param signData - structure with params:
    /// SignData {
    ///     uint256 tokenId; - NFT token id
    ///     uint256 quantity; - quantity of NFT token (if NFT token is ERC1155)
    ///     uint256 price; - sale price in token decimals.
    ///     uint256 nonce; - unique identifier to protect the use of the signature twice. Value should be higher by at least 1 (or more) each new transaction.
    ///     address token; - NFT token addres which will be exhibited
    ///     address saleToken; - token address for which will be sold
    ///     address buyer; - user address
    ///     bool tokenType; - false for ERC721 OR true for ERC1155
    /// }
    /// @param vrs - structure with signature params:
    /// @notice you should get it from backend with special script
    /// struct Vrs {
    ///     uint8 v;
    ///     bytes32 r;
    ///     bytes32 s;
    /// }

    function createOffer(
        SignData memory signData,
        Vrs memory vrs
    ) external nonReentrant {
        hasRole(
            OWNER_MARKETPLACE_ROLE,
            _getSigner(
                msg.sender,
                signData.tokenId,
                signData.quantity,
                signData.price,
                signData.nonce,
                signData.token,
                signData.saleToken,
                signData.tokenType,
                vrs
            )
        );
        require(accountNonce[msg.sender] < signData.nonce, "Wrong nonce.");
        accountNonce[msg.sender] = signData.nonce;

        _createOffer(
            signData.token,
            signData.tokenId,
            signData.quantity,
            signData.price,
            signData.saleToken,
            signData.tokenType
        );
    }

    /// @dev internal function for creating offer

    function _createOffer(
        address token,
        uint256 tokenId,
        uint256 quantity,
        uint256 price,
        address saleToken,
        bool tokenType
    ) internal {
        if (saleToken != address(0)) {
            require(isContains(saleToken), "Cannot be sold for this token.");
        }

        uint256 offerId = uint256(_offersCounter.current());

        offers[offerId] = OfferData(
            tokenId,
            price,
            quantity,
            msg.sender,
            token,
            saleToken,
            tokenType
        );

        _offersCounter.increment();

        if (IERC165(token).supportsInterface(type(IERC721).interfaceId)) {
            require(
                IERC721(token).isApprovedForAll(msg.sender, address(this)),
                "Not approved token"
            );
        } else {
            require(
                IERC165(token).supportsInterface(type(IERC1155).interfaceId),
                "Not supported token"
            );
            require(
                IERC1155(token).isApprovedForAll(msg.sender, address(this)),
                "Token is not approved"
            );
        }

        emit CreatedOffer(
            offerId,
            tokenType,
            msg.sender,
            token,
            tokenId,
            quantity,
            saleToken,
            price
        );
    }

    /// @dev edit offer function to edit the specified offer
    /// @param offerId - id of the created offer
    /// @param quantity - new quantity of NFT token (if NFT token is ERC1155)
    /// @param price - new price for offer
    /// @param saleToken - new token address for which will be sold

    function editOffer(
        uint256 offerId,
        uint256 quantity,
        uint256 price,
        address saleToken
    ) external {
        require(isOfferExist(offerId), "Offer does not exist.");
        OfferData memory offer = getOfferInfo(offerId);
        require(msg.sender == offer.creator, "Not creator of offer");

        if (offer.price != price) {
            require(price > 0, "Price should be positive");
            offers[offerId].price = price;
        }
        if (offer.quantity != quantity && offer.tokenType) {
            require(quantity > 0, "Quantity should be positive");
            offers[offerId].quantity = quantity;
        }
        if (offer.saleToken != saleToken) {
            if (saleToken != address(0)) {
                require(
                    isContains(saleToken),
                    "Cannot be sold for this token."
                );
            }
            offers[offerId].saleToken = saleToken;
        }

        emit EditOffer(offerId, quantity, price, saleToken);
    }

    /// @dev purchase created offer
    /// @notice Function for buying a certain offer
    /// @param offerId - id of the offer
    /// @param quantity - quantity of NFT token (if NFT token is ERC1155)

    function purchase(
        uint256 offerId,
        uint256 quantity
    ) external payable nonReentrant {
        require(isOfferExist(offerId), "Offer does not exist.");
        OfferData memory offer = getOfferInfo(offerId);
        require(quantity <= offer.quantity, "Quantity too big.");
        require(offer.creator != msg.sender, "You are owner of the offer.");

        uint256 amount = offer.price * quantity;
        uint256 royaltyAmount = 0;

        if (quantity == offer.quantity) {
            delete offers[offerId];
        } else {
            offers[offerId].quantity -= quantity;
        }

        if (offer.tokenType) {
            if (
                IERC1155(offer.token).supportsInterface(
                    type(IERC2981).interfaceId
                )
            ) {
                (, royaltyAmount) = getRoyaltyInfo(
                    offer.token,
                    offer.tokenId,
                    amount
                );
                _repayRoyalty(
                    msg.sender,
                    offer.saleToken,
                    offer.token,
                    offer.tokenId,
                    amount
                );
            }
            IERC1155(offer.token).safeTransferFrom(
                offer.creator,
                msg.sender,
                offer.tokenId,
                quantity,
                bytes("")
            );
        } else {
            if (
                IERC721(offer.token).supportsInterface(
                    type(IERC2981).interfaceId
                )
            ) {
                (, royaltyAmount) = getRoyaltyInfo(
                    offer.token,
                    offer.tokenId,
                    amount
                );
                _repayRoyalty(
                    msg.sender,
                    offer.saleToken,
                    offer.token,
                    offer.tokenId,
                    amount
                );
            }
            IERC721(offer.token).safeTransferFrom(
                offer.creator,
                msg.sender,
                offer.tokenId,
                bytes("")
            );
        }

        if (offer.saleToken == address(0)) {
            require(
                amount + royaltyAmount == msg.value,
                "Value is not equal to price."
            );

            (bool sent, ) = payable(offer.creator).call{
                value: msg.value - royaltyAmount
            }("");
            require(sent, "Failed to send Ether");
        } else {
            require(msg.value == 0, "Unnecessary transfer of Ether.");

            IERC20(offer.saleToken).safeTransferFrom(
                msg.sender,
                offer.creator,
                amount - royaltyAmount
            );
        }

        emit Purchased(msg.sender, offerId, quantity);
    }

    /// @dev cancel created offer
    // @param id - offer id

    function cancel(uint256 id) external nonReentrant {
        require(isOfferExist(id), "Offer does not exist.");
        OfferData memory offer = getOfferInfo(id);
        require(offer.creator == msg.sender, "You are not owner of the offer.");

        delete offers[id];

        emit OfferCanceled(msg.sender, id);
    }

    /// @dev Сheck if the offer has been created
    /// @param offerId - id if the offer

    function isOfferExist(uint256 offerId) public view returns (bool) {
        if (offers[offerId].price != 0) return true;
        else return false;
    }

    /// @notice Returns full information about offer
    /// @dev Returns offer object by id with all params
    /// @param offerId id of offer
    /// @return offer object with all contains params

    function getOfferInfo(
        uint256 offerId
    ) public view returns (OfferData memory) {
        return offers[offerId];
    }

    /// @dev Check if this contract support interface
    /// @dev Need for checking by other contract if this contract support standard
    /// @param interfaceId interface identifier

    function supportsInterface(
        bytes4 interfaceId
    )
        public
        view
        virtual
        override(AccessControlEnumerable, ERC1155Receiver)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
