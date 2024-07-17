// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";
import "@openzeppelin/contracts/utils/introspection/ERC165.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./ERC1155Signature.sol";

abstract contract ERC1155MintableRoyalty is
    AccessControl,
    ERC2981,
    ERC1155Burnable,
    ERC1155Signature,
    ERC1155URIStorage
{
    using Counters for Counters.Counter;
    Counters.Counter internal _tokenIds;

    bytes32 public constant SIGNER_ERC1155_ROLE =
        keccak256("SIGNER_ERC1155_ROLE");

    string public name;
    string public symbol;

    mapping(uint256 => address) public creators;
    uint128 constant hundredPercent = 10000;

    mapping(address => uint256) private accountNonce; // user => nonceCouner;

    event Mint(
        address indexed creator,
        uint256 id,
        uint128 fee,
        uint256 supply,
        string uri
    );

    modifier onlySigner() {
        require(
            hasRole(SIGNER_ERC1155_ROLE, msg.sender),
            "Caller is not a signer."
        );
        _;
    }

    constructor(
        string memory _name,
        string memory _symbol,
        string memory _version,
        string memory _uri
    ) {
        __Signature_init(_name, _version);
        name = _name;
        symbol = _symbol;
        _setBaseURI(_uri);
    }

    /// @notice For minting any ERC1155 user should get sign by server
    /// @dev Mint ERC1155 token
    /// @param supply amount of tokens that should be mint
    /// @param fee fee, that creator want get after every sell
    /// @param nonce user's unique transaction ID
    /// @param uri metadata
    /// @param v sign v value
    /// @param r sign r value
    /// @param s sign s value
    function mint(
        uint256 supply,
        uint96 fee,
        uint256 nonce,
        string memory uri,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        uint256 id = _tokenIds.current();
        require(supply != 0, "Supply should be positive");
        require(fee <= hundredPercent / 2, "Royalties can not be bigger 50%");
        require(
            hasRole(
                SIGNER_ERC1155_ROLE,
                _getSigner(supply, fee, nonce, msg.sender, uri, v, r, s)
            ),
            "SignedAdmin should sign tokenId"
        );
        require(accountNonce[msg.sender] < nonce, "Wrong nonce.");
        accountNonce[msg.sender] = nonce;

        creators[id] = msg.sender;

        _setTokenRoyalty(id, msg.sender, fee);
        _mint(msg.sender, id, supply, bytes(""));
        _setURI(id, uri);
        _tokenIds.increment();

        emit Mint(msg.sender, id, fee, supply, uri);
    }

    /// @dev Returns full path of metadata content by token id
    /// @param id token identifier
    /// @return full url path for receive metadata

    function uri(uint256 id)
        public
        view
        override(ERC1155, ERC1155URIStorage)
        returns (string memory)
    {
        return ERC1155URIStorage.uri(id);
    }

    function setBaseURI(string memory _uri) external onlySigner {
        _setBaseURI(_uri);
    }

    /**
     * @dev See {IERC165-supportsInterface}.
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155, AccessControl, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
