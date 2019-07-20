pragma solidity ^0.4.24;

contract Strategy {

  address public fund;

  constructor(address fund_) public {
    fund = fund_;
  }

  function name() external pure returns (string);

  function nav() external view returns (uint256);

  function subscribe(address investor) payable public returns (uint256 amount);

  function redeem(address investor, uint256 amount) public;

  function rebalance() public;

  function handover(Strategy newStrategy) public;

  modifier onlyByFund {
    require(msg.sender == fund, "Only can be called by the fund");
    _;
  }
}

interface StrategyFactory {
  function create(address fund) external returns (Strategy strategy);
}
