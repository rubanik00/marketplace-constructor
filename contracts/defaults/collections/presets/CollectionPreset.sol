// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../CollectionsCore.sol";

contract CollectionsPreset is CollectionsCore {
    constructor() CollectionsCore() {}

    /// @notice Create collection with ERC1155 or ERC721 contract tokens
    /// @dev Create new collection entity in mapping
    /// @dev Possible to create collection only with OWNER_COLLECTIONS_ROLE
    /// @param tokens verifiable array of tokens
    /// @param implementation address token implementation

    function createCollection(uint256[] calldata tokens, address implementation)
        external
        onlyRole(OWNER_COLLECTIONS_ROLE)
    {
        _createCollection(tokens, implementation);
    }
}
