// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {OmniCoinV2} from "./OmniCoinV2.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ILayerZeroEndpoint} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";

contract OmniCoinFactoryV2 {
  ILayerZeroEndpoint public _lzEndpoint;

  event LocalCoinDeployed(address indexed coinAddress, address indexed creator);
  event RemoteCoinDeployed(
    address indexed remoteFactoryAddress,
    address indexed creator,
    uint16 indexed chainId
  );

  constructor(address payable lzEndpointAddress) {
    _lzEndpoint = ILayerZeroEndpoint(lzEndpointAddress);
  }

  function getLzEndpointAddress() external view returns (address) {
    return address(_lzEndpoint);
  }

  function deployLocalCoin(
    string memory coinName,
    string memory coinTicker,
    uint8 coinDecimals,
    uint256 coinTotalSupply
  ) external {
    OmniCoinV2 newCoin = new OmniCoinV2(
      coinName,
      coinTicker,
      coinDecimals,
      coinTotalSupply,
      msg.sender
    );

    emit LocalCoinDeployed(address(newCoin), msg.sender);
  }

  function deployRemoteCoin(
    string memory coinName,
    string memory coinTicker,
    uint8 coinDecimals,
    uint256 coinTotalSupply,
    uint16 remoteChainId
  ) external {
    // TODO:    Implement the remote coin deployment
    //          Implement the lzReceive function
    address remoteFactoryAddress = address(this);

    //     _lzEndpoint.send{value: msg.value}(
    //         params.remoteConfig.chainId,
    //         _trustedRemoteLookup[params.remoteConfig.chainId],
    //         abi.encode(params), // payload
    //         payable(msg.sender),
    //         address(0x0),
    //         bytes("")
    //     );

    emit RemoteCoinDeployed(remoteFactoryAddress, msg.sender, remoteChainId);
  }
}
