// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

/**
 * @title Decentralized Marketplace
 * @dev On-chain marketplace for trading Pokemon NFTs
 */
contract Marketplace is ReentrancyGuard, Ownable, Pausable {
    IERC721 public pokemonNFT;
    
    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        uint256 createdAt;
        bool active;
    }
    
    // Mapping from listing ID to Listing
    mapping(uint256 => Listing) public listings;
    uint256 public listingCounter;
    
    // Mapping from tokenId to listing ID (to prevent duplicate listings)
    mapping(uint256 => uint256) public tokenToListing;
    
    // Marketplace fee (in basis points, e.g., 250 = 2.5%)
    uint256 public marketplaceFee = 250; // 2.5%
    address public feeRecipient;
    
    // Events
    event ListingCreated(
        uint256 indexed listingId,
        address indexed seller,
        uint256 indexed tokenId,
        uint256 price
    );
    
    event ListingCancelled(
        uint256 indexed listingId,
        address indexed seller
    );
    
    event NFTPurchased(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 tokenId,
        uint256 price
    );
    
    event PriceUpdated(
        uint256 indexed listingId,
        uint256 newPrice
    );
    
    constructor(address _pokemonNFT, address _feeRecipient) Ownable() {
        pokemonNFT = IERC721(_pokemonNFT);
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Create a new listing
     */
    function createListing(uint256 tokenId, uint256 price) external whenNotPaused {
        require(price > 0, "Price must be greater than 0");
        require(pokemonNFT.ownerOf(tokenId) == msg.sender, "Not the owner");
        require(pokemonNFT.getApproved(tokenId) == address(this) || 
                pokemonNFT.isApprovedForAll(msg.sender, address(this)), 
                "Marketplace not approved");
        require(tokenToListing[tokenId] == 0 || !listings[tokenToListing[tokenId]].active, 
                "Token already listed");
        
        listingCounter++;
        listings[listingCounter] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            createdAt: block.timestamp,
            active: true
        });
        
        tokenToListing[tokenId] = listingCounter;
        
        emit ListingCreated(listingCounter, msg.sender, tokenId, price);
    }
    
    /**
     * @dev Cancel a listing
     */
    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        
        listing.active = false;
        tokenToListing[listing.tokenId] = 0;
        
        emit ListingCancelled(listingId, msg.sender);
    }
    
    /**
     * @dev Purchase an NFT from a listing
     */
    function purchase(uint256 listingId) external payable nonReentrant whenNotPaused {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(msg.value >= listing.price, "Insufficient payment");
        require(msg.sender != listing.seller, "Cannot buy your own listing");
        
        // Calculate fees
        uint256 feeAmount = (listing.price * marketplaceFee) / 10000;
        uint256 sellerAmount = listing.price - feeAmount;
        
        // Transfer NFT
        pokemonNFT.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        
        // Mark listing as inactive
        listing.active = false;
        tokenToListing[listing.tokenId] = 0;
        
        // Transfer funds
        (bool sellerSuccess, ) = payable(listing.seller).call{value: sellerAmount}("");
        require(sellerSuccess, "Seller transfer failed");
        
        if (feeAmount > 0) {
            (bool feeSuccess, ) = payable(feeRecipient).call{value: feeAmount}("");
            require(feeSuccess, "Fee transfer failed");
        }
        
        // Refund excess payment
        if (msg.value > listing.price) {
            (bool refundSuccess, ) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(refundSuccess, "Refund failed");
        }
        
        emit NFTPurchased(listingId, msg.sender, listing.seller, listing.tokenId, listing.price);
    }
    
    /**
     * @dev Update listing price
     */
    function updatePrice(uint256 listingId, uint256 newPrice) external {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");
        require(newPrice > 0, "Price must be greater than 0");
        
        listing.price = newPrice;
        
        emit PriceUpdated(listingId, newPrice);
    }
    
    /**
     * @dev Get listing details
     */
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }
    
    /**
     * @dev Get active listings count
     */
    function getActiveListingsCount() external view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 1; i <= listingCounter; i++) {
            if (listings[i].active) {
                count++;
            }
        }
        return count;
    }
    
    /**
     * @dev Set marketplace fee (owner only)
     */
    function setMarketplaceFee(uint256 _fee) external onlyOwner {
        require(_fee <= 1000, "Fee cannot exceed 10%");
        marketplaceFee = _fee;
    }
    
    /**
     * @dev Set fee recipient (owner only)
     */
    function setFeeRecipient(address _feeRecipient) external onlyOwner {
        require(_feeRecipient != address(0), "Invalid address");
        feeRecipient = _feeRecipient;
    }
    
    /**
     * @dev Pause marketplace (owner only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause marketplace (owner only)
     */
    function unpause() external onlyOwner {
        _unpause();
    }
}

