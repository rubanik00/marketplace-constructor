// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../extensions/MarketplaceLotLogicWithoutFee.sol";

contract MarketplacePresetWithoutFee is MarketplaceLotLogicWithoutFee {
    constructor(string memory _name, string memory _version)
        MarketplaceLotLogicWithoutFee(_name, _version)
    {
        _setupRole(OWNER_MARKETPLACE_ROLE, msg.sender);
        _setRoleAdmin(OWNER_MARKETPLACE_ROLE, OWNER_MARKETPLACE_ROLE);
    }
}
