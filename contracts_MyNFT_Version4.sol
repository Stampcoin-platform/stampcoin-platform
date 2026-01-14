// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721URIStorage, Ownable {
    uint256 public tokenCounter;

    constructor(string memory name_, string memory symbol_) ERC721(name_, symbol_) {
        tokenCounter = 0;
    }

    function mintTo(address to, string memory tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = tokenCounter + 1;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        tokenCounter = tokenId;
        return tokenId;
    }
}