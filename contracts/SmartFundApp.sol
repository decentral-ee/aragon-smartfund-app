pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "../uniswap/contracts/UniswapExchangeInterface.sol";
import "../uniswap/contracts/UniswapFactoryInterface.sol";

contract SmartFundApp is AragonApp {
    using SafeMath for uint256;

    /// Events
    event StrategyChanged();

    /// State
    string public proposedStrategy;
    string public strategy;

    /// ACL
    bytes32 constant public INVESTMENT_ROLE = keccak256("INVESTMENT_ROLE");
    bytes32 constant public FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 constant public STRATEGY_CHANGE_ROLE = keccak256("STRATEGY_CHANGE_ROLE");

    function initialize() public onlyInit {
        initialized();
    }

    function proposeStrategy(string strategy) external auth(FUND_MANAGER_ROLE) {
      require(bytes(proposedStrategy).length == 0, "Strategy is waiting to be approved");
      proposedStrategy = strategy;
    }

    function approveStrategy() external auth(STRATEGY_CHANGE_ROLE) {
      require(bytes(proposedStrategy).length != 0, "No strategy is waiting to be approved");
      strategy = proposedStrategy;
      delete proposedStrategy;
      emit StrategyChanged();
    }

    function rebalance() external auth(FUND_MANAGER_ROLE) {

    }

    function subscribe() external auth(INVESTMENT_ROLE) {

    }

    function redeem() external auth(INVESTMENT_ROLE) {

    }
}
