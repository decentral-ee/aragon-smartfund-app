pragma solidity ^0.4.24;

import "@aragon/os/contracts/lib/token/ERC20.sol";
import "../uniswap/contracts/UniswapExchangeInterface.sol";
import "../uniswap/contracts/UniswapFactoryInterface.sol";

import "./Strategy.sol";


contract DemoStrategy is Strategy {

  uint32 TOTAL_PROPORTIONS = 1000000;

  UniswapFactoryInterface public uniswapFactory;
  uint256 totalUnits;
  address[] public tokens;
  mapping (address => uint32) public proportions;
  mapping (address => address) exchanges;
  mapping (address => uint256) units;

  constructor (address fund) public Strategy(fund) {
  }

  function configure(
    UniswapFactoryInterface uniswapFactory_,
    address[] newTokens,
    uint32[] newProportions) public onlyByFund {
    require(newTokens.length == newProportions.length, "invalid configuration");
    uniswapFactory = uniswapFactory_;
    uint i;
    uint j;
    bool found;
    address newToken;
    address existingToken;
    uint32 totalProportions;
    // add new token and update new proportions
    for (i = 0; i < newTokens.length; ++i) {
      found = false;
      newToken = newTokens[i];
      proportions[newToken] = newProportions[i];
      totalProportions += newProportions[i];
      for (j = 0; j < tokens.length; ++j) {
        existingToken = tokens[j];
        if (newToken == existingToken) {
          found = true;
          break;
        }
      }
      if (!found) {
        tokens.push(newToken);
      }
    }
    // delete removed tokens
    for (j = 0; j < tokens.length; ++j) {
      found = false;
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
      exchanges[existingToken] = uniswapFactory.getExchange(tokens[i]);
    }
    // normalize proportions to the total of TOTAL_PROPORTIONS
    for (j = 0; j < tokens.length; ++j) {
      existingToken = tokens[j];
      proportions[existingToken] =  proportions[existingToken] * TOTAL_PROPORTIONS / totalProportions;
    }
  }

  function name() external pure returns (string) {
    return "demo";
  }

  function nav() external view returns (uint256 nav) {
    return _nav();
  }

  function totalUnitCount() external view returns (uint256) {
    return totalUnits;
  }

  function unitPrice() external view returns (uint256 unitPrice) {
    (unitPrice, ) = _unitPriceNav();
  }

  function unitCount(address investor) external view returns (uint256 nUnits) {
    return units[investor];
  }

  function subscribe(address investor) payable external
    onlyByFund
    returns (uint256 newUnits, uint256 currentUnitPrice) {
    require(msg.value > 0, "At least more than 0 ether needed");
    uint256 nav;
    (currentUnitPrice, nav) = _unitPriceNav();
    newUnits = msg.value / currentUnitPrice;
    totalUnits += newUnits;
    units[investor] += newUnits;
    _rebalance(nav + msg.value);
  }

  function redeem(address investor, uint256 nUnits) external onlyByFund {
    require(nUnits > 0, "Put at least 1 unit for sale");
    require(units[investor] >= nUnits, "Not enough units to redeem");
    (uint256 currentUnitPrice, uint256 nav) = _unitPriceNav();
    uint256 estimatedValue = currentUnitPrice * nUnits;
    totalUnits -= nUnits;
    units[investor] -= nUnits;
    _rebalance(nav > estimatedValue ? nav - estimatedValue : 0);
    investor.transfer(MIN(estimatedValue, this.balance));
  }

  function rebalance() external onlyByFund {
    uint256 nav = _nav();
    _rebalance(nav);
  }

  function handover(Strategy newStrategy) external onlyByFund {
    // TODO
  }

  function _nav() private view returns (uint256) {
    uint nav;
    for (uint i = 0; i < tokens.length; ++i) {
      ERC20 token = ERC20(tokens[i]);
      UniswapExchangeInterface exchange = UniswapExchangeInterface(uniswapFactory.getExchange(token));
      uint256 tokenBalance = token.balanceOf(address(this));
      nav += tokenBalance > 0 ? exchange.getTokenToEthInputPrice(tokenBalance) : 0;
    }
    return nav + this.balance - msg.value /* subtract current value */;
  }

  function _unitPriceNav() private view returns (uint256 unitPrice, uint256 nav) {
    nav = _nav();
    if (totalUnits == 0) {
      unitPrice =  1 finney / (10 ** UNIT_COUNT_DECIMALS);
    } else {
      unitPrice = nav / totalUnits;
    }
  }

  function _rebalance(uint256 newNav) private {
    uint i;
    uint256[] memory tokensBoughtAmounts = new uint256[](tokens.length);
    uint256[] memory ethSoldAmount = new uint256[](tokens.length);
    uint256 totalEthSold;

    ERC20 token;
    UniswapExchangeInterface exchange;

    // sell assets
    for (i = 0; i < tokens.length; ++i) {
      token = ERC20(tokens[i]);
      exchange = UniswapExchangeInterface(exchanges[token]);
      uint256 targetBalance = exchange.getEthToTokenInputPrice(
        // navShare
        newNav * proportions[token] / TOTAL_PROPORTIONS
      );
      uint256 currentBalance = token.balanceOf(address(this));
      if (targetBalance > currentBalance) {
        tokensBoughtAmounts[i] = targetBalance - currentBalance;
        ethSoldAmount[i] = exchange.getEthToTokenOutputPrice(tokensBoughtAmounts[i]);
        totalEthSold += ethSoldAmount[i];
      } else if (targetBalance < currentBalance) {
        token.approve(address(exchange), currentBalance - targetBalance);
        exchange.tokenToEthSwapInput(currentBalance - targetBalance, 1, now + 1 hours);
      }
    }
    // buy assets
    uint256 realEthBalance = this.balance;
    for (i = 0; i < tokens.length; ++i) {
      token = ERC20(tokens[i]);
      exchange = UniswapExchangeInterface(exchanges[token]);
      if (tokensBoughtAmounts[i] > 0) {
        exchange.ethToTokenSwapInput.value(
          MIN(
            this.balance,
            realEthBalance * ethSoldAmount[i] / totalEthSold)
        )(1, now + 1 hours);
      }
    }
  }

  function MIN(uint256 a, uint256 b) private returns (uint256) {
    if (a > b) return b;
    else return a;
  }

  function() external payable { }
}

contract DemoStrategyFactory is StrategyFactory {
  function create(address fund) external returns (Strategy strategy) {
    strategy = new DemoStrategy(fund);
  }
}
