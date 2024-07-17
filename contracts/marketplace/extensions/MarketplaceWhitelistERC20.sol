// SPDX-License-Identifier: MIT
pragma solidity 0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MarketplaceWhitelistERC20 {
    using EnumerableSet for EnumerableSet.AddressSet;

    EnumerableSet.AddressSet private whitelistedTokens20;

    event AddedERC20Token(address erc20Token);
    event RemovedERC20Token(address erc20Token);

    /// @dev Get list of whitelisted tokens

    function getWhitelistedTokens() public view returns (address[] memory) {
        return whitelistedTokens20.values();
    }

    /// @dev Сheck if the offer has been added

    function isContains(address tokenAddress) public view returns (bool) {
        return whitelistedTokens20.contains(tokenAddress);
    }

    /// @dev Add erc-20 token to whitelist
    /// @param tokens - array of tokens that will be added to the whitelist

    function _addTokensToWhitelist(address[] memory tokens) internal {
        for (uint256 i; i < tokens.length; ++i) {
            whitelistedTokens20.add(tokens[i]);
            emit AddedERC20Token(tokens[i]);
        }
    }

    /// @dev Remove erc-20 token from whitelist
    /// @param tokens - array of tokens that will be removed from the whitelist

    function _removeTokensFromWhitelist(address[] memory tokens) internal {
        for (uint256 i; i < tokens.length; ++i) {
            whitelistedTokens20.remove(tokens[i]);
            emit RemovedERC20Token(tokens[i]);
        }
    }
}
