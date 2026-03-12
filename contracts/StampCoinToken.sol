// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title StampCoin Token (STC)
/// @notice ERC-20 token for marketplace fees, rewards, and settlement.
contract StampCoinToken is ERC20, Ownable {
    uint256 public constant INITIAL_SUPPLY = 42_000_000 * 10 ** 18;

    constructor(address treasury) ERC20("StampCoin", "STC") {
        require(treasury != address(0), "treasury required");
        _transferOwnership(treasury);
        _mint(treasury, INITIAL_SUPPLY);
    }

    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "invalid recipient");
        _mint(to, amount);
    }
}
