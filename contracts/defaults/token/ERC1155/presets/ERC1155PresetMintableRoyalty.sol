// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../extensions/ERC1155MintableRoyalty.sol";

contract ERC1155PresetMintableRoyalty is ERC1155MintableRoyalty {
    constructor(
        string memory _name,
        string memory _symbol,
        string memory _version,
        string memory _uri,
        address signer,
        uint96 feeInBeeps
    ) ERC1155(_uri) ERC1155MintableRoyalty(_name, _symbol, _version, _uri) {
        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SIGNER_ERC1155_ROLE, signer);
        _setDefaultRoyalty(_msgSender(), feeInBeeps);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155MintableRoyalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
