pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";


contract SmartFundApp is AragonApp {
    using SafeMath for uint256;

    /// Events
    /* event Increment(address indexed entity, uint256 step);
    event Decrement(address indexed entity, uint256 step); */

    /// State
    uint256 public value;

    /// ACL
    bytes32 constant public INVESTMENT_ROLE = keccak256("INVESTMENT_ROLE");
    bytes32 constant public PROPOSE_STRATEGY_CHANGE_ROLE = keccak256("PROPOSE_STRATEGY_CHANGE_ROLE");
    bytes32 constant public APPROVE_STRATEGY_CHANGE_ROLE = keccak256("APPROVE_STRATEGY_CHANGE_ROLE");

    function initialize() public onlyInit {
        initialized();
    }

    /**
     * @notice Increment the counter by `step`
     * @param step Amount to increment by
     */
    /* function increment(uint256 step) external auth(INCREMENT_ROLE) {
        value = value.add(step);
        emit Increment(msg.sender, step);
    } */

    /**
     * @notice Decrement the counter by `step`
     * @param step Amount to decrement by
     */
    /* function decrement(uint256 step) external auth(DECREMENT_ROLE) {
        value = value.sub(step);
        emit Decrement(msg.sender, step);
    } */
}
