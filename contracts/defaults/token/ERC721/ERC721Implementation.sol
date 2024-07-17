// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract ERC721Implementation is ERC721, AccessControl {
    /// @dev Sets main dependencies and constants
    /// @param name 721 nft name
    /// @param symbol 721 nft symbol

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {}

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
