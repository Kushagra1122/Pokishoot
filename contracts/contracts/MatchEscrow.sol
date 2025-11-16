// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MatchEscrow
 * @dev Smart contract for handling match staking and automatic payouts
 */
contract MatchEscrow is Ownable, ReentrancyGuard {
    using ECDSA for bytes32;

    struct Match {
        address playerA;
        address playerB;
        uint256 stake;
        bool playerADeposited;
        bool playerBDeposited;
        bool settled;
        bool canceled;
        uint256 createdAt;
    }

    // Mapping from matchId to Match
    mapping(bytes32 => Match) public matches;
    
    // Mapping from player address to total points
    mapping(address => uint256) public points;

    // Server nonce to prevent replay attacks
    mapping(bytes32 => uint256) public matchNonces;

    // Events
    event MatchCreated(
        bytes32 indexed matchId,
        address indexed playerA,
        address indexed playerB,
        uint256 stake
    );

    event MatchJoined(
        bytes32 indexed matchId,
        address indexed player,
        uint256 stake
    );

    event MatchResult(
        bytes32 indexed matchId,
        address indexed winner,
        uint256 scoreA,
        uint256 scoreB,
        uint256 totalPayout,
        uint256 serverNonce
    );

    event MatchCanceled(
        bytes32 indexed matchId,
        string reason
    );

    event PointsUpdated(
        address indexed player,
        uint256 totalPoints
    );

    constructor() Ownable() {}

    /**
     * @dev Create a new match with initial stake
     * @param matchId Unique identifier for the match
     * @param playerA Address of first player
     * @param playerB Address of second player
     */
    function createMatch(
        bytes32 matchId,
        address playerA,
        address playerB
    ) external payable {
        require(playerA != address(0), "Invalid playerA");
        require(playerB != address(0), "Invalid playerB");
        require(playerA != playerB, "Players must be different");
        require(matches[matchId].createdAt == 0, "Match already exists");
        require(msg.value > 0, "Stake must be greater than 0");

        matches[matchId] = Match({
            playerA: playerA,
            playerB: playerB,
            stake: msg.value,
            playerADeposited: true, // Creator deposits first stake
            playerBDeposited: false,
            settled: false,
            canceled: false,
            createdAt: block.timestamp
        });

        emit MatchCreated(matchId, playerA, playerB, msg.value);
    }

    /**
     * @dev Join an existing match by depositing stake
     * @param matchId Unique identifier for the match
     */
    function joinMatch(bytes32 matchId) external payable {
        Match storage matchData = matches[matchId];
        require(matchData.createdAt != 0, "Match does not exist");
        require(!matchData.settled, "Match already settled");
        require(!matchData.canceled, "Match is canceled");
        require(
            msg.sender == matchData.playerB,
            "Only playerB can join"
        );
        require(
            msg.value == matchData.stake,
            "Stake amount mismatch"
        );
        require(!matchData.playerBDeposited, "Already deposited");

        matchData.playerBDeposited = true;
        emit MatchJoined(matchId, msg.sender, msg.value);
    }

    /**
     * @dev Submit match result with server signatures
     * @param matchId Unique identifier for the match
     * @param winner Address of the winner
     * @param scoreA Score of playerA
     * @param scoreB Score of playerB
     * @param serverNonce Unique nonce to prevent replay
     * @param sigA Signature from server for playerA
     * @param sigB Signature from server for playerB
     */
    function submitResult(
        bytes32 matchId,
        address winner,
        uint256 scoreA,
        uint256 scoreB,
        uint256 serverNonce,
        bytes memory sigA,
        bytes memory sigB
    ) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.createdAt != 0, "Match does not exist");
        require(!matchData.settled, "Match already settled");
        require(!matchData.canceled, "Match is canceled");
        require(
            matchData.playerADeposited && matchData.playerBDeposited,
            "Both players must deposit"
        );
        require(
            winner == matchData.playerA || winner == matchData.playerB,
            "Winner must be a player"
        );
        require(
            matchNonces[matchId] < serverNonce,
            "Invalid or reused nonce"
        );

        // Create message hash for signature verification
        bytes32 messageHash = keccak256(
            abi.encodePacked(
                matchId,
                winner,
                scoreA,
                scoreB,
                serverNonce,
                address(this)
            )
        );
        bytes32 ethSignedMessageHash = ECDSA.toEthSignedMessageHash(messageHash);

        // Verify signatures from server
        address signerA = ethSignedMessageHash.recover(sigA);
        address signerB = ethSignedMessageHash.recover(sigB);
        
        require(signerA == owner(), "Invalid signature A");
        require(signerB == owner(), "Invalid signature B");

        // Update nonce
        matchNonces[matchId] = serverNonce;

        // Mark as settled
        matchData.settled = true;

        // Calculate total payout
        uint256 totalStake = matchData.stake * 2;
        
        // Pay winner (all stakes)
        (bool success, ) = payable(winner).call{value: totalStake}("");
        require(success, "Transfer failed");

        emit MatchResult(
            matchId,
            winner,
            scoreA,
            scoreB,
            totalStake,
            serverNonce
        );

        // Update points (optional: can be used for leaderboard)
        points[winner] += scoreA > scoreB ? scoreA : scoreB;
        emit PointsUpdated(winner, points[winner]);
    }

    /**
     * @dev Cancel a match and refund deposits
     * @param matchId Unique identifier for the match
     */
    function cancelMatch(bytes32 matchId) external nonReentrant {
        Match storage matchData = matches[matchId];
        require(matchData.createdAt != 0, "Match does not exist");
        require(!matchData.settled, "Match already settled");
        require(!matchData.canceled, "Match already canceled");
        
        // Only owner or players can cancel
        require(
            msg.sender == owner() ||
            msg.sender == matchData.playerA ||
            msg.sender == matchData.playerB,
            "Not authorized to cancel"
        );

        matchData.canceled = true;

        // Refund deposits
        if (matchData.playerADeposited) {
            (bool successA, ) = payable(matchData.playerA).call{
                value: matchData.stake
            }("");
            require(successA, "Refund A failed");
        }

        if (matchData.playerBDeposited) {
            (bool successB, ) = payable(matchData.playerB).call{
                value: matchData.stake
            }("");
            require(successB, "Refund B failed");
        }

        emit MatchCanceled(matchId, "Match canceled");
    }

    /**
     * @dev Get match details
     * @param matchId Unique identifier for the match
     */
    function getMatch(bytes32 matchId)
        external
        view
        returns (Match memory)
    {
        return matches[matchId];
    }

    /**
     * @dev Get points for a player
     * @param player Address of the player
     */
    function getPoints(address player) external view returns (uint256) {
        return points[player];
    }

    /**
     * @dev Set points for a player (owner only, for manual updates)
     * @param player Address of the player
     * @param total Total points to set
     */
    function setPoints(address player, uint256 total) external onlyOwner {
        points[player] = total;
        emit PointsUpdated(player, total);
    }

    /**
     * @dev Emergency withdraw (owner only)
     */
    function emergencyWithdraw() external onlyOwner {
        (bool success, ) = payable(owner()).call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}

