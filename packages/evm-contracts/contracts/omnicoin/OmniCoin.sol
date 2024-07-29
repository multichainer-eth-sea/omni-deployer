// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract OmniCoin is ERC20 {
  uint8 private coinDecimals;

  constructor(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver
  ) ERC20(_coinName, _coinTicker) {
    coinDecimals = _coinDecimals;
    _mint(_receiver, _coinTotalSupply);
  }

  function decimals() public view virtual override returns (uint8) {
    return coinDecimals;
  }
}
