// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ICollections.sol";

interface ICollectionsWithSignature is ICollections {
    function createCollection(
        uint256[] calldata tokens,
        address implementation,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
