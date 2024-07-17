// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ICollectionsCoreUpgradeable.sol";

interface ICollectionsWithSignatureUpgradeable is ICollectionsCoreUpgradeable {
    function createCollection(uint256[] calldata tokens, address implementation)
        external;
}
