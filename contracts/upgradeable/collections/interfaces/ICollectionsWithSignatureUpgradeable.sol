// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "./ICollectionsCoreUpgradeable.sol";

interface ICollectionsWithSignatureUpgradeable is ICollectionsCoreUpgradeable {
    function initialize(string memory _name, string memory _version) external;

    function createCollection(
        uint256[] calldata tokens,
        address implementation,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external;
}
