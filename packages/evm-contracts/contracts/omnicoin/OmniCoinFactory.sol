// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {OmniCoin} from "./OmniCoin.sol";

contract OmniCoinFactory {
  event OmniCoinCreated(address indexed coinAddress, address indexed creator);

  function createOmniCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply
  ) public {
    OmniCoin newCoin = new OmniCoin(
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      msg.sender
    );

    emit OmniCoinCreated(address(newCoin), msg.sender);
  }
}
