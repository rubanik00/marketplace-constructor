// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title Marketplce Fee Logic Extension
/// @notice This extension was created as an addition to the main Marketplace contract.
contract MarketplaceFeeLogic {
    using SafeERC20 for IERC20;

    uint32 private fee;
    uint32 private constant PERCENTAGE = 10000;

    uint256 private ethBalance;
    mapping(address => uint256) private tokenBalances;

    event SetFee(uint32 newFee);
    event TopUpFee(address currency, uint256 amount);
    event UnlockFee(address currency, address to, uint256 amount);

    /// @dev Set new fee
    /// @notice internal method for setting new platform fee.
    /// @param newFee - new fee in persantage.

    function _setFee(uint32 newFee) internal {
        require(newFee <= PERCENTAGE, "Fee can not be more than 10%.");
        fee = newFee;
        emit SetFee(newFee);
    }

    /// @dev Get current fee

    function getFee() public view returns (uint32) {
        return fee;
    }

    /// @dev Calculate the percentage of a fee
    /// @param value - full amount.

    function _calculatePart(uint256 value) internal view returns (uint256) {
        return (value * fee) / 100000;
    }

    /// @dev Subtract and transfer percentage from user action
    /// @param tokenAddress - address of the token that will be paid as a fee.
    /// @param value - amount of full price.

    function _topUpFee(address tokenAddress, uint256 value) internal {
        uint256 amount = _calculatePart(value);

        if (address(tokenAddress) != address(0)) {
            tokenBalances[tokenAddress] += amount;
            IERC20(tokenAddress).safeTransferFrom(
                msg.sender,
                address(this),
                amount
            );
        } else {
            ethBalance += amount;
        }
        emit TopUpFee(tokenAddress, amount);
    }

    /// @dev Withdraw all ETH from contract to the owner
    /// @param _to address of the recipient

    function _unlockETH(address _to) internal {
        uint256 amount = ethBalance;
        require(amount > 0, "Balance is zero.");
        ethBalance = 0;
        (bool sent, ) = _to.call{value: amount}("");
        require(sent, "Failed to send Ether");
        emit UnlockFee(address(0), _to, amount);
    }

    /// @dev Withdraw ERC20 token balance from contract address
    /// @param tokenAddress address of the ERC20 token contract whose tokens will be withdrawn to the recipient
    /// @param _to address of the recipient

    function _unlockTokens(IERC20 tokenAddress, address _to) internal {
        uint256 amount = tokenBalances[address(tokenAddress)];
        require(amount > 0, "Balance is zero.");
        tokenBalances[address(tokenAddress)] = 0;
        tokenAddress.safeTransfer(_to, amount);
        emit UnlockFee(address(tokenAddress), _to, amount);
    }
}
