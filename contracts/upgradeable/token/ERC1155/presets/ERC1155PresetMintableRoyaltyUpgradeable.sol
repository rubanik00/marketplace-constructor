// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../extensions/ERC1155MintableRoyaltyUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract ERC1155PresetMintableRoyaltyUpgradeable is
    ERC1155MintableRoyaltyUpgradeable
{
    function initialize(
        string memory _name,
        string memory _symbol,
        string memory _version,
        string memory _uri,
        address signer,
        uint96 feeInBeeps
    ) public virtual initializer {
        __ERC1155_init(_uri);
        __ERC1155RoyaltyUpgradeable_init(_name, _symbol, _version, _uri);

        _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
        _setupRole(SIGNER_ERC1155_ROLE, signer);
        _setDefaultRoyalty(_msgSender(), feeInBeeps);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC1155MintableRoyaltyUpgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
