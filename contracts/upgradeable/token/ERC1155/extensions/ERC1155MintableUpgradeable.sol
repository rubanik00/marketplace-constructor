// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC1155/extensions/ERC1155URIStorageUpgradeable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC1155Signature.sol";

contract ERC1155MintableUpgradeable is
    AccessControlUpgradeable,
    ERC1155Upgradeable,
    ERC1155BurnableUpgradeable,
    ERC1155URIStorageUpgradeable,
    ERC1155Signature
{
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    bytes32 public constant SIGNER_ERC1155_ROLE =
        keccak256("SIGNER_ERC1155_ROLE");

    string public name;
    string public symbol;

    mapping(uint256 => address) public creators;
    mapping(address => uint256) private accountNonce; // user => nonceCouner;

    event Mint(address indexed creator, uint256 id, uint256 supply, string uri);

    modifier onlySigner() {
        require(
            hasRole(SIGNER_ERC1155_ROLE, msg.sender),
            "Caller is not a signer."
        );
        _;
    }

    function __ERC1155MintableUpgradeable_init(
        string memory _name,
        string memory _symbol,
        string memory _version,
        string memory _uri
    ) internal onlyInitializing {
        __ERC1155MintableUpgradeable_init_unchained(
            _name,
            _symbol,
            _version,
            _uri
        );
    }

    function __ERC1155MintableUpgradeable_init_unchained(
        string memory _name,
        string memory _symbol,
        string memory _version,
        string memory _uri
    ) internal onlyInitializing {
        __Signature_init(_name, _version);

        name = _name;
        symbol = _symbol;
        _setBaseURI(_uri);
    }

    /// @dev Check if this contract support interface
    /// @dev Need for checking by other contract if this contract support standard
    /// @param interfaceId interface identifier
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155Upgradeable, AccessControlUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /// @notice For minting any ERC1155 user should get sign by server
    /// @dev Mint ERC1155 token
    /// @param supply amount of tokens that should be mint
    /// @param nonce user's unique transaction ID
    /// @param uri metadata
    /// @param v sign v value
    /// @param r sign r value
    /// @param s sign s value
    function mint(
        uint256 supply,
        uint256 nonce,
        string memory uri,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external virtual {
        uint256 id = _tokenIds.current();
        require(supply != 0, "Supply should be positive");
        require(
            hasRole(
                SIGNER_ERC1155_ROLE,
                _getSigner(supply, nonce, msg.sender, uri, v, r, s)
            ),
            "SignedAdmin should sign tokenId"
        );
        require(accountNonce[msg.sender] < nonce, "Wrong nonce.");
        accountNonce[msg.sender] = nonce;

        creators[id] = msg.sender;

        _mint(msg.sender, id, supply, bytes(""));
        _setURI(id, uri);
        _tokenIds.increment();

        emit Mint(msg.sender, id, supply, uri);
    }

    /// @dev Returns full path of metadata content by token id
    /// @param id token identifier
    /// @return full url path for receive metadata

    function uri(uint256 id)
        public
        view
        override(ERC1155Upgradeable, ERC1155URIStorageUpgradeable)
        returns (string memory)
    {
        return ERC1155URIStorageUpgradeable.uri(id);
    }

    function setBaseURI(string memory _uri) external onlySigner {
        _setBaseURI(_uri);
    }
}
