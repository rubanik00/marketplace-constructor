// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../CollectionsCoreUpgradeable.sol";
import "../CollectionsSignatureUpgradeable.sol";
import "../interfaces/ICollectionsWithSignatureUpgradeable.sol";

/// @title Collection Contract
/// @notice Contract that able to create collections based on ERC1155 and ERC721 tokens
/// @dev Able to create create collection with ERC1155 and ERC721 contract tokens

contract CollectionsPresetWithSignatureUpgradeable is
    ICollectionsWithSignatureUpgradeable,
    CollectionsCoreUpgradeable,
    CollectionSignatureUpgradeable
{
    bytes32 public constant SIGNER_COLLECTIONS_ROLE =
        keccak256("SIGNER_COLLECTIONS_ROLE");

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(string memory _name, string memory _version)
        external
        initializer
    {
        __CollectionSignature_init(_name, _version);

        _setupRole(OWNER_COLLECTIONS_ROLE, msg.sender);
        _setRoleAdmin(OWNER_COLLECTIONS_ROLE, OWNER_COLLECTIONS_ROLE);
        _setRoleAdmin(SIGNER_COLLECTIONS_ROLE, OWNER_COLLECTIONS_ROLE);
    }

    /// @notice Create collection with ERC1155 contract tokens
    /// @dev Create new collection entity in mapping
    /// @dev Possible to create collection only with sign throw CollectionSignature
    /// @param tokens verifiable array of tokens
    /// @param implementation address token implementation
    /// @param v sign v value
    /// @param r sign r value
    /// @param s sign s value

    function createCollection(
        uint256[] calldata tokens,
        address implementation,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external {
        require(
            hasRole(
                SIGNER_COLLECTIONS_ROLE,
                _getSigner(tokens, implementation, _msgSender(), v, r, s)
            ),
            "SignedAdmin should sign tokenId"
        );

        _createCollection(tokens, implementation);
    }
}
