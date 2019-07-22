pragma solidity ^0.4.24;

contract Strategy {

  uint32 constant UNIT_COUNT_DECIMALS = 6;

  address public fund;

  constructor(address fund_) public {
    fund = fund_;
  }

  function name() external pure returns (string);

  function totalUnitCount() external view returns (uint256);

  function unitPrice() external view returns (uint256);

  function nav() external view returns (uint256);

  function unitCount(address investor) external view returns (uint256 units);

  function subscribe(address investor) payable external returns (uint256 newUnits, uint256 currentUnitPrice);

  function redeem(address investor, uint256 amount) external;

  function rebalance() external;

  function handover(Strategy newStrategy) external;

  modifier onlyByFund {
    require(msg.sender == fund, "Only can be called by the fund");
    _;
  }
}

interface StrategyFactory {
  function create(address fund) external returns (Strategy strategy);
}
