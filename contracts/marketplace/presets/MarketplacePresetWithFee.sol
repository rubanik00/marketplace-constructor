// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "../extensions/MarketplaceLotLogicWithFee.sol";

contract MarketplacePresetWithFee is MarketplaceLotLogicWithFee {
    constructor(
        uint32 _fee,
        string memory _name,
        string memory _version
    ) MarketplaceLotLogicWithFee(_fee, _name, _version) {
        _setupRole(OWNER_MARKETPLACE_ROLE, msg.sender);
        _setRoleAdmin(OWNER_MARKETPLACE_ROLE, OWNER_MARKETPLACE_ROLE);
    }
}
