// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title PokeWars Governance Token
 * @dev ERC20 token with voting capabilities for DAO governance
 */
contract GovernanceToken is ERC20, ERC20Votes, Ownable {
    // Token distribution
    uint256 public constant TOTAL_SUPPLY = 1000000000 * 10**18; // 1 billion tokens
    uint256 public constant COMMUNITY_TREASURY = 400000000 * 10**18; // 40%
    uint256 public constant TEAM_ALLOCATION = 200000000 * 10**18; // 20%
    uint256 public constant LIQUIDITY_POOL = 200000000 * 10**18; // 20%
    uint256 public constant REWARDS_POOL = 200000000 * 10**18; // 20%
    
    address public communityTreasury;
    address public liquidityPool;
    address public rewardsPool;
    
    // Mapping to track if address can mint (for rewards)
    mapping(address => bool) public minters;
    
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);
    
    constructor(
        address _communityTreasury,
        address _liquidityPool,
        address _rewardsPool,
        address _teamWallet
    ) ERC20("PokeWars Token", "PWT") ERC20Permit("PokeWars Token") ERC20Votes() Ownable() {
        communityTreasury = _communityTreasury;
        liquidityPool = _liquidityPool;
        rewardsPool = _rewardsPool;
        
        // Initial distribution
        _mint(_communityTreasury, COMMUNITY_TREASURY);
        _mint(_liquidityPool, LIQUIDITY_POOL);
        _mint(_rewardsPool, REWARDS_POOL);
        _mint(_teamWallet, TEAM_ALLOCATION);
        
        // Make rewards pool a minter
        minters[_rewardsPool] = true;
    }
    
    /**
     * @dev Mint tokens (only for authorized minters like rewards pool)
     */
    function mint(address to, uint256 amount) external {
        require(minters[msg.sender], "Not authorized to mint");
        _mint(to, amount);
    }
    
    /**
     * @dev Add minter (owner only)
     */
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }
    
    /**
     * @dev Remove minter (owner only)
     */
    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
    }
    
    /**
     * @dev Override _afterTokenTransfer for snapshot functionality
     */
    function _afterTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal override(ERC20, ERC20Votes) {
        super._afterTokenTransfer(from, to, amount);
    }
    
    /**
     * @dev Override _mint for snapshot functionality
     */
    function _mint(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(account, amount);
    }
    
    /**
     * @dev Override _burn for snapshot functionality
     */
    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
    
    /**
     * @dev Override nonces for permit
     */
    function nonces(address owner)
        public
        view
        override(ERC20Permit)
        returns (uint256)
    {
        return super.nonces(owner);
    }
}

