// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC721SignatureFee.sol";
import "./ERC721RoyaltyUpgradeable.sol";

contract ERC721MintableRoyaltyUpgradeable is
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    AccessControlUpgradeable,
    ERC721SignatureFee,
    ERC721RoyaltyUpgradeable
{
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    bytes32 public constant SIGNER_ERC721_ROLE =
        keccak256("SIGNER_ERC721_ROLE");

    uint128 constant hundredPercent = 10000;
    mapping(uint256 => address) public creators;
    mapping(address => uint256) private accountNonce; // user => nonceCouner;

    event Mint(address indexed creator, uint256 id, uint128 fee, string uri);
    event SetTokenURI(uint256 tokenId, string _tokenURI);

    modifier onlySigner() {
        require(
            hasRole(SIGNER_ERC721_ROLE, msg.sender),
            "Caller is not a signer."
        );
        _;
    }

    function __ERC721MintableFeeUpgradeable_init(
        string memory _name,
        string memory _symbol,
        string memory _version
    ) internal onlyInitializing {
        __ERC721MintableFeeUpgradeable_init_unchained(_name, _symbol, _version);
    }

    function __ERC721MintableFeeUpgradeable_init_unchained(
        string memory _name,
        string memory _symbol,
        string memory _version
    ) internal onlyInitializing {
        __Signature_init(_name, _version);
        __ERC721_init(_name, _symbol);
    }

    /// @dev Check if this contract support interface
    /// @dev Need for checking by other contract if this contract support standard
    /// @param interfaceId interface identifier

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(
            ERC721Upgradeable,
            AccessControlUpgradeable,
            ERC721RoyaltyUpgradeable
        )
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @dev Get total supply of minted tokens

    function getTotalSupply() external view returns (uint256) {
        return _tokenIds.current();
    }

    /// @dev Return the token URI. Included baseUri concatenated with tokenUri
    /// @param tokenId Id of ERC721 token

    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    /// @dev burn a existing ERC721 token
    /// @param tokenId Id of ERC721 token

    function _burn(uint256 tokenId)
        internal
        virtual
        override(
            ERC721Upgradeable,
            ERC721URIStorageUpgradeable,
            ERC721RoyaltyUpgradeable
        )
    {
        ERC721RoyaltyUpgradeable._burn(tokenId);
    }

    /// @dev Set the token URI
    /// @param tokenId Id of ERC721 token
    /// @param _tokenURI token URI without base URI

    function setTokenURI(uint256 tokenId, string memory _tokenURI)
        external
        onlySigner
    {
        super._setTokenURI(tokenId, _tokenURI);
        emit SetTokenURI(tokenId, _tokenURI);
    }

    /// @notice For minting any ERC721 user should get sign by server
    /// @dev Mint ERC721 token
    /// @param fee fee, that creator want get after every sell
    /// @param nonce user's unique transaction ID
    /// @param uri token metadata
    /// @param v sign v value
    /// @param r sign r value
    /// @param s sign s value

    function mint(
        uint96 fee,
        uint256 nonce,
        string memory uri,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        uint256 id = _tokenIds.current();
        require(fee <= hundredPercent / 2, "Royalties can not be bigger 50%");
        require(
            hasRole(
                SIGNER_ERC721_ROLE,
                _getSigner(fee, nonce, uri, msg.sender, v, r, s)
            ),
            "SignedAdmin should sign tokenId"
        );
        require(accountNonce[msg.sender] < nonce, "Wrong nonce.");
        accountNonce[msg.sender] = nonce;
        creators[id] = msg.sender;

        _setTokenRoyalty(id, msg.sender, fee);
        _safeMint(msg.sender, id);
        _setTokenURI(id, uri);
        _tokenIds.increment();

        emit Mint(msg.sender, id, fee, uri);
    }
}
