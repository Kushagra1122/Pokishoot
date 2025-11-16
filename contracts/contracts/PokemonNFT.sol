// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title PokemonNFT
 * @dev ERC721 NFT contract for Pokemon with metadata storage and level tracking
 */
contract PokemonNFT is ERC721URIStorage, Ownable, ReentrancyGuard {
    // Token ID counter
    uint256 private _tokenIdCounter;

    // Mapping from token ID to Pokemon data
    mapping(uint256 => PokemonData) public pokemonData;

    // Mapping from token ID to level
    mapping(uint256 => uint256) public pokemonLevels;

    // Struct to store Pokemon metadata
    struct PokemonData {
        string name;
        string pokemonType;
        uint256 shootRange;
        uint256 shootPerMin;
        uint256 hitPoints;
        uint256 speed;
        string spriteURI;
        uint256 mintedAt;
    }

    // Events
    event PokemonMinted(
        uint256 indexed tokenId,
        address indexed to,
        string name,
        string pokemonType,
        uint256 level
    );

    event PokemonLevelUpgraded(
        uint256 indexed tokenId,
        uint256 oldLevel,
        uint256 newLevel
    );

    event PokemonBatchMinted(
        address indexed to,
        uint256[] tokenIds,
        string[] names
    );

    constructor() ERC721("PokemonNFT", "POKE") Ownable() {
        _tokenIdCounter = 1; // Start from token ID 1
    }

    /**
     * @dev Mint a new Pokemon NFT
     * @param to Address to mint the NFT to
     * @param name Pokemon name
     * @param pokemonType Pokemon type (e.g., "Fire", "Water")
     * @param shootRange Base shoot range stat
     * @param shootPerMin Base shoots per minute stat
     * @param hitPoints Base hit points stat
     * @param speed Base speed stat
     * @param spriteURI URI to the Pokemon sprite image
     * @param tokenURI URI to the token metadata JSON
     * @return tokenId The minted token ID
     */
    function mintPokemon(
        address to,
        string memory name,
        string memory pokemonType,
        uint256 shootRange,
        uint256 shootPerMin,
        uint256 hitPoints,
        uint256 speed,
        string memory spriteURI,
        string memory tokenURI
    ) public onlyOwner nonReentrant returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        // Mint the NFT
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Store Pokemon data
        pokemonData[tokenId] = PokemonData({
            name: name,
            pokemonType: pokemonType,
            shootRange: shootRange,
            shootPerMin: shootPerMin,
            hitPoints: hitPoints,
            speed: speed,
            spriteURI: spriteURI,
            mintedAt: block.timestamp
        });

        // Initialize level to 1
        pokemonLevels[tokenId] = 1;

        emit PokemonMinted(tokenId, to, name, pokemonType, 1);

        return tokenId;
    }

    /**
     * @dev Batch mint multiple Pokemon NFTs
     * @param to Address to mint the NFTs to
     * @param names Array of Pokemon names
     * @param pokemonTypes Array of Pokemon types
     * @param stats Array of stat arrays [shootRange, shootPerMin, hitPoints, speed]
     * @param spriteURIs Array of sprite URIs
     * @param tokenURIs Array of token metadata URIs
     * @return tokenIds Array of minted token IDs
     */
    function batchMintPokemon(
        address to,
        string[] memory names,
        string[] memory pokemonTypes,
        uint256[4][] memory stats,
        string[] memory spriteURIs,
        string[] memory tokenURIs
    ) public onlyOwner nonReentrant returns (uint256[] memory) {
        require(
            names.length == pokemonTypes.length &&
            names.length == stats.length &&
            names.length == spriteURIs.length &&
            names.length == tokenURIs.length,
            "PokemonNFT: Array length mismatch"
        );

        uint256[] memory tokenIds = new uint256[](names.length);

        for (uint256 i = 0; i < names.length; i++) {
            tokenIds[i] = mintPokemon(
                to,
                names[i],
                pokemonTypes[i],
                stats[i][0], // shootRange
                stats[i][1], // shootPerMin
                stats[i][2], // hitPoints
                stats[i][3], // speed
                spriteURIs[i],
                tokenURIs[i]
            );
        }

        emit PokemonBatchMinted(to, tokenIds, names);

        return tokenIds;
    }

    /**
     * @dev Upgrade Pokemon level (only owner of the token or contract owner)
     * @param tokenId The token ID to upgrade
     * @param newLevel The new level to set
     */
    function upgradeLevel(uint256 tokenId, uint256 newLevel) public {
        require(_ownerOf(tokenId) != address(0), "PokemonNFT: Token does not exist");
        require(
            ownerOf(tokenId) == msg.sender || owner() == msg.sender,
            "PokemonNFT: Not authorized to upgrade"
        );
        require(newLevel > pokemonLevels[tokenId], "PokemonNFT: New level must be higher");
        require(newLevel <= 100, "PokemonNFT: Max level is 100");

        uint256 oldLevel = pokemonLevels[tokenId];
        pokemonLevels[tokenId] = newLevel;

        emit PokemonLevelUpgraded(tokenId, oldLevel, newLevel);
    }

    /**
     * @dev Get full Pokemon data including level
     * @param tokenId The token ID
     * @return data PokemonData struct with all metadata
     * @return level Current level of the Pokemon
     */
    function getPokemonData(uint256 tokenId)
        public
        view
        returns (PokemonData memory data, uint256 level)
    {
        require(_ownerOf(tokenId) != address(0), "PokemonNFT: Token does not exist");
        return (pokemonData[tokenId], pokemonLevels[tokenId]);
    }

    /**
     * @dev Get Pokemon stats with level multipliers
     * @param tokenId The token ID
     * @return shootRange Adjusted shoot range
     * @return shootPerMin Adjusted shoots per minute
     * @return hitPoints Adjusted hit points
     * @return speed Adjusted speed
     */
    function getPokemonStats(uint256 tokenId)
        public
        view
        returns (
            uint256 shootRange,
            uint256 shootPerMin,
            uint256 hitPoints,
            uint256 speed
        )
    {
        require(_ownerOf(tokenId) != address(0), "PokemonNFT: Token does not exist");
        PokemonData memory data = pokemonData[tokenId];
        uint256 level = pokemonLevels[tokenId];

        // Calculate level multiplier (1% per level)
        uint256 multiplier = 100 + level; // 101% at level 1, 200% at level 100

        shootRange = (data.shootRange * multiplier) / 100;
        shootPerMin = (data.shootPerMin * multiplier) / 100;
        hitPoints = (data.hitPoints * multiplier) / 100;
        speed = (data.speed * multiplier) / 100;
    }

    /**
     * @dev Get the total number of tokens minted
     * @return The total supply
     */
    function totalSupply() public view returns (uint256) {
        return _tokenIdCounter - 1;
    }

    /**
     * @dev Override transfer to allow marketplace integration
     */
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public override(ERC721, IERC721) {
        super.transferFrom(from, to, tokenId);
    }

    /**
     * @dev Override safe transfer to allow marketplace integration
     */
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) public override(ERC721, IERC721) {
        super.safeTransferFrom(from, to, tokenId, data);
    }
}

