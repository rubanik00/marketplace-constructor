// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

interface ICollections {
    struct Collection {
        uint256[] tokens;
        address implementation;
        address creator;
    }

    function getCollection(uint256 collectionId)
        external
        returns (Collection memory);

    function getCollectionTokens(uint256 collectionId)
        external
        returns (uint256[] memory);

    function removeCollection(uint256 collectionId) external;

    function addTokensToCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) external;

    function removeTokensFromCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) external;
}
