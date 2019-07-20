pragma solidity ^0.4.24;

import "../uniswap/contracts/UniswapExchangeInterface.sol";
import "../uniswap/contracts/UniswapFactoryInterface.sol";

import "./Strategy.sol";


contract DemoStrategy is Strategy {

  address[] public tokens;
  mapping (address => uint32) public proportions;

  constructor (address fund) public Strategy(fund) {
  }

  function configure(
    address[] newTokens,
    uint32[] newProportions) public onlyByFund {
    require(newTokens.length == newProportions.length, "invalid configuration");
    uint i;
    uint j;
    address newToken;
    address existingToken;
    // update new proportions
    for (i = 0; i < newTokens.length; ++i) {
      newToken = newTokens[i];
      proportions[newToken] = newProportions[i];
    }
    // delete removed tokens
    for (j = 0; j < tokens.length; ++j) {
      bool found = false;
      existingToken = tokens[j];
      for (i = 0; i < newTokens.length; ++i) {
        newToken = newTokens[i];
        if (newToken == existingToken) {
          found = true;
          break;
        }
      }
      if (!found) {
        proportions[existingToken] = 0;
      }
    }
  }

  function name() external pure returns (string) {
    return "demo";
  }

  function nav() external view returns (uint256) {
    return 0;
  }

  function subscribe(address investor) payable public
    onlyByFund
    returns (uint256 amount) {
    require(msg.value > 0, "At least more than 0 ether needed ");
    return 0;
  }

  function redeem(address investor, uint256 amount) public onlyByFund {

  }

  function rebalance() public onlyByFund {

  }

  function handover(Strategy newStrategy) public onlyByFund {
  }
}

contract DemoStrategyFactory is StrategyFactory {
  function create(address fund) external returns (Strategy strategy) {
    strategy = new DemoStrategy(fund);
  }
}
