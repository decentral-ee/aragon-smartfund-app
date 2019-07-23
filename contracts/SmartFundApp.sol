pragma solidity ^0.4.24;

import "@aragon/os/contracts/apps/AragonApp.sol";
import "@aragon/os/contracts/lib/math/SafeMath.sol";

import "./Strategy.sol";

contract SmartFundApp is AragonApp {
    using SafeMath for uint256;

    /// Events
    event StrategyProposed(Strategy indexed proposedStrategy);
    event StrategyChanged(Strategy indexed newStrategy);
    event Subscribed(address indexed investor, uint256 units, uint256 unitPrice);
    event Redeemed(address indexed investor, uint256 amount);
    event Rebalanced();

    /// State
    Strategy public proposedStrategy;
    Strategy public currentStrategy;

    /// ACL
    bytes32 constant public INVESTMENT_ROLE = keccak256("INVESTMENT_ROLE");
    bytes32 constant public FUND_MANAGER_ROLE = keccak256("FUND_MANAGER_ROLE");
    bytes32 constant public STRATEGY_CHANGE_ROLE = keccak256("STRATEGY_CHANGE_ROLE");

    function initialize() public onlyInit {
        initialized();
    }

    function proposeStrategy(StrategyFactory strategyFactory, bytes configurationCall) external auth(FUND_MANAGER_ROLE) {
      require(proposedStrategy == address(0), "Strategy is waiting to be approved");
      proposedStrategy = strategyFactory.create(this);
      (bool success, ) = proposedStrategy.call(configurationCall);
      require(success, "Strategy configuration failed");
      emit StrategyProposed(proposedStrategy);
    }

    function approveStrategy() external auth(STRATEGY_CHANGE_ROLE) {
      require(proposedStrategy != address(0), "No strategy is waiting to be approved");

      Strategy oldStrategy = currentStrategy;

      if (oldStrategy != address(0)) {
        oldStrategy.handover(proposedStrategy);
      }

      currentStrategy = proposedStrategy;
      delete proposedStrategy;

      emit StrategyChanged(currentStrategy);
    }

    function strategyName() external view returns (string) {
      return address(currentStrategy) != address(0) ?
        currentStrategy.name() : "";
    }

    function totalUnitCount() external view returns (uint256) {
      return address(currentStrategy) != address(0) ?
        currentStrategy.totalUnitCount() : 0;
    }

    function unitPrice() external view returns (uint256) {
      return address(currentStrategy) != address(0) ?
        currentStrategy.unitPrice() : 0;
    }

    function nav() external view returns (uint256) {
      return address(currentStrategy) != address(0) ?
        currentStrategy.nav() : 0;
    }

    function unitCount(address investor) external view returns (uint256 units) {
      return address(currentStrategy) != address(0) ?
        currentStrategy.unitCount(investor) : 0;
    }

    function subscribe() external payable auth(INVESTMENT_ROLE) hasStrategy {
      (uint256 units, uint256 currentUnitPrice) = currentStrategy.subscribe.value(msg.value)(msg.sender);
      emit Subscribed(msg.sender, units, currentUnitPrice);
    }

    function redeem(uint256 amount) external auth(INVESTMENT_ROLE) hasStrategy {
      currentStrategy.redeem(msg.sender, amount);
      emit Redeemed(msg.sender, amount);
    }

    function rebalance() external auth(FUND_MANAGER_ROLE) hasStrategy {
      currentStrategy.rebalance();
      emit Rebalanced();
    }

    modifier hasStrategy() {
      require(currentStrategy != address(0), "There is no strategy yet");
      _;
    }
}
