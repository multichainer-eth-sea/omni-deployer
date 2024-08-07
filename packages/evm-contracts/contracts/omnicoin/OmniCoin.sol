// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {NativeOFT} from "@layerzerolabs/solidity-examples/contracts/token/oft/v1/NativeOFT.sol";

contract OmniCoin is NativeOFT {
  uint8 private coinDecimals;

  bytes32 public deploymentId;

  constructor(
    bytes32 _deploymentId,
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver,
    address _lzEndpoint
  ) NativeOFT(_coinName, _coinTicker, _lzEndpoint) {
    coinDecimals = _coinDecimals;
    deploymentId = _deploymentId;
    _mint(_receiver, _coinTotalSupply);
  }

  function decimals() public view virtual override returns (uint8) {
    return coinDecimals;
  }
}
