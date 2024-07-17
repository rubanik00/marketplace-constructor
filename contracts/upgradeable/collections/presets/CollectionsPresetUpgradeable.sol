// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../CollectionsCoreUpgradeable.sol";

contract CollectionsPresetUpgradeable is CollectionsCoreUpgradeable {
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() external initializer {
        _setupRole(OWNER_COLLECTIONS_ROLE, msg.sender);
        _setRoleAdmin(OWNER_COLLECTIONS_ROLE, OWNER_COLLECTIONS_ROLE);
    }

    function createCollection(uint256[] calldata tokens, address implementation)
        external
        onlyRole(OWNER_COLLECTIONS_ROLE)
    {
        _createCollection(tokens, implementation);
    }
}
