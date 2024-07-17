// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts-upgradeable/token/ERC1155/ERC1155Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

/// @title ERC1155 Contract
/// @dev Simple 1155 contract with supporting Royalty standard
/// @dev Using ERC1155Signature for sign mint operation
contract ERC1155Implementation is AccessControlUpgradeable, ERC1155Upgradeable {
    string public name;
    string public symbol;

    /// @dev Sets main dependencies and constants
    /// @param _uri server url path for receive nft metadata
    /// @param _name 1155 nft name
    /// @param _symbol 1155 nft symbol
    /// @return true if initialization complete success
    function init(
        string memory _uri,
        string memory _name,
        string memory _symbol
    ) external returns (bool) {
        __ERC1155_init(_uri);

        name = _name;
        symbol = _symbol;

        return true;
    }

    /// @dev Check if this contract support interface
    /// @dev Need for checking by other contract if this contract support standard
    /// @param interfaceId interface identifier
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControlUpgradeable, ERC1155Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
