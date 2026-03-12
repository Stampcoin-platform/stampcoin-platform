// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title Stamp NFT
/// @notice ERC-721 for user-submitted stamp images minted as NFTs.
contract StampNFT is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 1;
    uint256 public mintFee;
    uint16 public platformFeeBps = 1500; // 15%
    address public feeTreasury;

    event StampMinted(
        uint256 indexed tokenId,
        address indexed creator,
        string tokenURI,
        uint256 mintFeePaid
    );

    constructor(address treasury, uint256 initialMintFee) ERC721("Stamp NFT", "SNFT") {
        require(treasury != address(0), "treasury required");
        _transferOwnership(treasury);
        feeTreasury = treasury;
        mintFee = initialMintFee;
    }

    function setMintFee(uint256 newMintFee) external onlyOwner {
        mintFee = newMintFee;
    }

    function setPlatformFeeBps(uint16 newBps) external onlyOwner {
        require(newBps <= 2500, "fee too high");
        platformFeeBps = newBps;
    }

    function setFeeTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "invalid treasury");
        feeTreasury = newTreasury;
    }

    function mintStamp(address to, string calldata metadataURI) external payable returns (uint256 tokenId) {
        require(bytes(metadataURI).length > 0, "metadataURI required");
        require(msg.value >= mintFee, "insufficient mint fee");

        tokenId = nextTokenId;
        nextTokenId += 1;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        if (msg.value > 0) {
            (bool sent, ) = payable(feeTreasury).call{value: msg.value}("");
            require(sent, "fee transfer failed");
        }

        emit StampMinted(tokenId, msg.sender, metadataURI, msg.value);
    }
}
