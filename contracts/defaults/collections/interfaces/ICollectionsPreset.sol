// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ICollections.sol";

interface ICollectionsPreset is ICollections {
    function createCollection(uint256[] calldata tokens, address implementation)
        external;
}
