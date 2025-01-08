// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Blockchain-Based E-Voting System
 * @dev This contract manages small-scale elections using blockchain technology.
 * @author  born2code265@gmail.com
 * @notice This contract manages small-scale elections using blockchain technology.
 */

// #############################################################################
// #########                   smart contract for e votiting            ########
// #############################################################################
contract EVoting {
    // Address of the admin who can create elections
    address public admin;

    // #############################################################################
    // #########                  Structure of an election                  ########
    // #############################################################################

    struct Election {
        string name;
        string[] candidates;
        mapping(string => uint256) votes;
        mapping(address => bool) hasVoted;
        bool isActive;
        uint256 startTime;
        uint256 endTime;
        bool resultsAnnounced;
    }

    // Mapping of election ID to election details
    mapping(uint256 electionId => Election electionDetails) public elections;

    // Total number of elections
    uint256 public electionCount;

    // #############################################################################
    // #########                  Events                                    ########
    // #############################################################################

    // Event emitted when a new election is created
    event ElectionCreated(
        uint256 electionId,
        string name,
        uint256 startTime,
        uint256 endTime
    );

    // Event emitted when a vote is cast
    event VoteCast(uint256 electionId, address voter, string candidate);

    // Event emitted when an election ends
    event ElectionEnded(uint256 electionId, string winner);

    // #############################################################################
    // #########                  Modifiers                                 ########
    // #############################################################################

    // Modifier to restrict access to the admin
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    // Modifier to check if an election exists

    modifier electionExists(uint256 electionId) {
        require(electionId < electionCount, "Election does not exist");
        _;
    }

    // Modifier to check if an election is active
    modifier onlyDuringElection(uint256 electionId) {
        require(
            block.timestamp >= elections[electionId].startTime &&
                block.timestamp <= elections[electionId].endTime,
            "Election is not active"
        );
        _;
    }

    // #############################################################################
    // #########                  Constructor                               ########
    // #############################################################################
    constructor() {
        admin = msg.sender;
    }

    /**
     * @notice Creates a new election.
     * @param name Name of the election.
     * @param candidates List of candidates for the election.
     * @param startTime Start time of the election (in UNIX timestamp).
     * @param endTime End time of the election (in UNIX timestamp).
     */
    function createElection(
        string memory name,
        string[] memory candidates,
        uint256 startTime,
        uint256 endTime
    ) public onlyAdmin {
        // Validate the input parameters
        // Check if the name is not empty
        require(bytes(name).length > 0, "Name cannot be empty");

        // Check if the start time is in the future
        require(startTime < endTime, "Start time must be before end time");

        // Check if there are at least two candidates
        require(candidates.length > 1, "There must be at least two candidates");

        // Create the election
        Election storage newElection = elections[electionCount];
        newElection.name = name;
        newElection.candidates = candidates;
        newElection.isActive = true;
        newElection.startTime = startTime;
        newElection.endTime = endTime;
        newElection.resultsAnnounced = false;

        // Emit an event
        emit ElectionCreated(electionCount, name, startTime, endTime);

        // Increment the election count
        electionCount++;
    }

    /**
     * @notice Cast a vote for a candidate in an election.
     * @param electionId ID of the election.
     * @param candidate Name of the candidate to vote for.
     */
    function vote(
        uint256 electionId,
        string memory candidate
    ) public electionExists(electionId) onlyDuringElection(electionId) {
        Election storage election = elections[electionId];

        require(
            !election.hasVoted[msg.sender],
            "You have already voted in this election"
        );

        bool validCandidate = false;
        for (uint256 i = 0; i < election.candidates.length; i++) {
            if (
                keccak256(abi.encodePacked(election.candidates[i])) ==
                keccak256(abi.encodePacked(candidate))
            ) {
                validCandidate = true;
                break;
            }
        }
        require(validCandidate, "Invalid candidate");

        election.votes[candidate]++;
        election.hasVoted[msg.sender] = true;

        emit VoteCast(electionId, msg.sender, candidate);
    }

    /**
     * @notice Get the vote count for a specific candidate in an election.
     * @param electionId ID of the election.
     * @param candidate Name of the candidate.
     * @return uint256 Vote count for the candidate.
     */
    function getVoteCount(
        uint256 electionId,
        string memory candidate
    ) public view electionExists(electionId) returns (uint256) {
        return elections[electionId].votes[candidate];
    }

    /**
     * @notice Get the list of candidates for an election.
     * @param electionId ID of the election.
     * @return string[] List of candidates.
     */
    function getCandidates(
        uint256 electionId
    ) public view electionExists(electionId) returns (string[] memory) {
        return elections[electionId].candidates;
    }

    /**
     * @notice End an election and announce the winner.
     * @param electionId ID of the election.
     */
    function endElection(
        uint256 electionId
    ) public onlyAdmin electionExists(electionId) {
        Election storage election = elections[electionId];

        require(
            block.timestamp > election.endTime,
            "Election is still ongoing"
        );
        require(election.isActive, "Election has already ended");

        election.isActive = false;
        election.resultsAnnounced = true;

        // Determine the winner
        string memory winner;
        uint256 highestVotes = 0;
        for (uint256 i = 0; i < election.candidates.length; i++) {
            string memory candidate = election.candidates[i];
            uint256 candidateVotes = election.votes[candidate];

            if (candidateVotes > highestVotes) {
                highestVotes = candidateVotes;
                winner = candidate;
            }
        }

        emit ElectionEnded(electionId, winner);
    }

    /**
     * @notice Check if a voter has voted in a specific election.
     * @param electionId ID of the election.
     * @param voter Address of the voter.
     * @return bool Whether the voter has voted.
     */
    function hasVoted(
        uint256 electionId,
        address voter
    ) public view electionExists(electionId) returns (bool) {
        return elections[electionId].hasVoted[voter];
    }
}
