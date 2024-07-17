// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Multicall is AccessControl {
    bytes32 public constant OWNER_MULTICALL_ROLE =
        keccak256("OWNER_MULTICALL_ROLE");

    struct Call {
        address target;
        bytes callData;
    }
    struct Result {
        bool success;
        bytes returnData;
    }

    /// @dev Check if caller is contract owner
    modifier onlyOwner() {
        require(
            hasRole(OWNER_MULTICALL_ROLE, msg.sender),
            "Multicall:: Caller is not an owner."
        );
        _;
    }

    constructor() {
        _setupRole(OWNER_MULTICALL_ROLE, msg.sender);
        _setRoleAdmin(OWNER_MULTICALL_ROLE, OWNER_MULTICALL_ROLE);
    }

    /// @dev aggregate call of different methods
    /// @param calls - array of params for call:
    ///     struct Call {
    ///     address target; - contrac address
    ///     bytes callData; - transaction data
    /// }

    function aggregate(Call[] memory calls)
        external
        onlyOwner
        returns (uint256 blockNumber, bytes[] memory returnData)
    {
        blockNumber = block.number;
        returnData = new bytes[](calls.length);
        for (uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(
                calls[i].callData
            );
            require(success, "Multicall aggregate: call failed");
            returnData[i] = ret;
        }
    }
}
