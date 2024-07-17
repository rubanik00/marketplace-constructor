// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/ICollectionsCoreUpgradeable.sol";

/// @title Collection Contract
/// @notice Contract that able to create collections based on ERC1155 and ERC721 tokens
/// @dev Able to create create collection with ERC1155 and ERC721 contract tokens

abstract contract CollectionsCoreUpgradeable is
    ICollectionsCoreUpgradeable,
    AccessControlUpgradeable
{
    mapping(uint256 => Collection) public collections;
    mapping(address => mapping(uint256 => uint256)) public tokenCollection;

    bytes32 public constant OWNER_COLLECTIONS_ROLE =
        keccak256("OWNER_COLLECTIONS_ROLE");

    uint256 public collectionCounter;

    event CreateCollection(
        uint256 collectionId,
        address creator,
        address implementation,
        uint256[] tokens
    );
    event RemoveCollection(uint256 collectionId, uint256[] tokens);
    event AddTokensToCollection(uint256 collectionId, uint256[] tokens);
    event RemoveTokensFromCollection(uint256 collectionId, uint256[] tokens);

    /// @dev Check if caller is collection creator
    /// @param collectionId id of collection

    modifier onlyCreator(uint256 collectionId) {
        require(
            collections[collectionId].creator == msg.sender,
            "Only creator can do action with collection"
        );
        _;
    }

    /// @dev Set main dependencies and constants

    function __CollectionsUpgradeable_init() internal onlyInitializing {
        __CollectionsUpgradeable_init_unchained();
    }

    function __CollectionsUpgradeable_init_unchained()
        internal
        onlyInitializing
    {
        __AccessControl_init();
    }

    /// @notice Return collection
    /// @dev Return collection object by id with all declare params
    /// @param collectionId id of collection
    /// @return collection object with creator and implementation

    function getCollection(uint256 collectionId)
        external
        view
        returns (Collection memory)
    {
        return collections[collectionId];
    }

    /// @notice Return collection tokens
    /// @dev Return collection object by id with all declare params
    /// @param collectionId id of collection
    /// @return collection tokens array

    function getCollectionTokens(uint256 collectionId)
        external
        view
        returns (uint256[] memory)
    {
        return collections[collectionId].tokens;
    }

    /// @notice Create collection with ERC1155 or ERC721 contract tokens
    /// @dev Create new collection entity in mapping
    /// @dev Possible to create collection only with OWNER_COLLECTIONS_ROLE
    /// @param tokens verifiable array of tokens
    /// @param implementation address token implementation

    function _createCollection(
        uint256[] calldata tokens,
        address implementation
    ) internal {
        _checkTokensWithoutCollection(tokens, implementation);
        collections[++collectionCounter] = Collection(
            tokens,
            implementation,
            _msgSender()
        );

        for (uint256 i = 0; i < tokens.length; i++) {
            require(
                tokenCollection[implementation][tokens[i]] == 0,
                "Tokens contain same values"
            );
            tokenCollection[implementation][tokens[i]] = collectionCounter;
        }

        emit CreateCollection(
            collectionCounter,
            _msgSender(),
            implementation,
            tokens
        );
    }

    /// @notice Remove collection from contract
    /// @dev Remove collection entity from mapping. Remove all included token(s) dependencies with collection
    /// @param collectionId id of collection that should remove

    function removeCollection(uint256 collectionId)
        external
        onlyCreator(collectionId)
    {
        Collection memory collection = collections[collectionId];

        if (collection.tokens.length > 0) {
            _removeCollectionFromToken(collectionId, collection.tokens);
        }

        delete collections[collectionId];

        emit RemoveCollection(collectionId, collection.tokens);
    }

    /// @notice Add new tokens to collection
    /// @dev Push token(s) to tokens array in collection, by id
    /// @param collectionId id of collection
    /// @param tokens array of tokens, that should be added to collection

    function addTokensToCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) external onlyCreator(collectionId) {
        address implementation = collections[collectionId].implementation;

        require(
            _checkTokensWithoutCollection(tokens, implementation),
            "Impossible add this tokens to collection"
        );

        _addTokensToCollection(collectionId, tokens);

        for (uint256 i = 0; i < tokens.length; i++) {
            tokenCollection[implementation][tokens[i]] = collectionId;
        }

        emit AddTokensToCollection(collectionId, tokens);
    }

    /// @notice Remove tokens from collection
    /// @dev Remove token(s) from  tokens array in collection, by id
    /// @param collectionId id of collection
    /// @param tokens array of tokens, that should be remove from collection

    function removeTokensFromCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) external onlyCreator(collectionId) {
        require(
            _checkTokensCollection(tokens, collectionId),
            "Impossible remove this tokens from collection"
        );

        _removeTokensFromCollection(collectionId, tokens);
        _removeCollectionFromToken(collectionId, tokens);

        emit RemoveTokensFromCollection(collectionId, tokens);
    }

    /// @notice Remove dependency between token id and collection id
    /// @dev Remove from mapping entry with token(s) key
    /// @param tokens array

    function _removeCollectionFromToken(
        uint256 collectionId,
        uint256[] memory tokens
    ) private {
        address implementation = collections[collectionId].implementation;
        for (uint256 i = 0; i < tokens.length; i++) {
            delete tokenCollection[implementation][tokens[i]];
        }
    }

    /// @notice Add token(s) to collection
    /// @dev Push to token array in Collection entity new token(s) id(s)
    /// @param collectionId id of collection
    /// @param tokens array

    function _addTokensToCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) private {
        for (uint256 i = 0; i < tokens.length; i++) {
            collections[collectionId].tokens.push(tokens[i]);
        }
    }

    /// @notice Remove token(s) from collection
    /// @dev Remove token(s) id(s) from tokens array in collection entity
    /// @param collectionId id of collection
    /// @param tokens array

    function _removeTokensFromCollection(
        uint256 collectionId,
        uint256[] memory tokens
    ) private {
        uint256 index;
        for (uint256 i = 0; i < tokens.length; i++) {
            index = _find(collections[collectionId].tokens, tokens[i]);
            collections[collectionId].tokens[index] = collections[collectionId]
                .tokens[collections[collectionId].tokens.length - 1];
            collections[collectionId].tokens.pop();
        }
    }

    /// @notice Return index of element in array
    /// @dev Linear search in non-sort array. Return index in current array
    /// @param array array of elements
    /// @param value value of required element

    function _find(uint256[] memory array, uint256 value)
        internal
        pure
        returns (uint256 index)
    {
        for (uint256 i = 0; i < array.length; i++) {
            if (value == array[i]) {
                return i;
            }
        }
        revert("Try to find element, that not in collection");
    }

    /// @notice Check if token(s) are part of any collection
    /// @dev Cycle check if every token don't already have collection in dependency
    /// @param tokens array of tokens
    /// @param collectionId id of collection
    /// @return true, if all tokens are free from collection and false if at least one of tokens already part of any collection

    function _checkTokensCollection(
        uint256[] memory tokens,
        uint256 collectionId
    ) internal view returns (bool) {
        address implementation = collections[collectionId].implementation;
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokenCollection[implementation][tokens[i]] != collectionId) {
                return false;
            }
        }
        return true;
    }

    /// @notice Check if all tokens are without any collection
    /// @dev Cycle check if every token don't already have collection
    /// @param tokens array of tokens
    /// @param implementation address token implementation
    /// @return true, if all tokens are free from collection and false if at least one of tokens already part of any collection

    function _checkTokensWithoutCollection(
        uint256[] memory tokens,
        address implementation
    ) internal view returns (bool) {
        for (uint256 i = 0; i < tokens.length; i++) {
            if (tokenCollection[implementation][tokens[i]] != 0) {
                return false;
            }
        }
        return true;
    }
}
