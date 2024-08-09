// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {OmniCoin} from "./OmniCoin.sol";

contract OmniFactoryStorage {
  // deployedCoins[bytes32(deploymentId)][uint16(chainId)] = address(coin)
  mapping(bytes32 => mapping(uint16 => bytes)) public deployedCoins;

  // mapping of user nonces
  mapping(address => uint256) public userNonces;

  // Functions to get and set values
  function setDeployedCoin(
    bytes32 _deploymentId,
    uint16 _chainId,
    bytes memory _coinAddress
  ) public {
    deployedCoins[_deploymentId][_chainId] = _coinAddress;
  }

  function getDeployedCoin(
    bytes32 _deploymentId,
    uint16 _chainId
  ) public view returns (bytes memory) {
    return deployedCoins[_deploymentId][_chainId];
  }

  function getDeployedCoinAddress(
    bytes32 _deploymentId,
    uint16 _chainId
  ) public view returns (address) {
    return abi.decode(deployedCoins[_deploymentId][_chainId], (address));
  }

  function incrementUserNonce(address _user) public {
    userNonces[_user]++;
  }

  function getUserNonce(address _user) public view returns (uint256) {
    return userNonces[_user];
  }

  function deployLocalCoin(
    bytes32 _deploymentId,
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver,
    address _lzEndpoint,
    uint16 _chainId
  ) public returns (address newCoin) {
    newCoin = address(
      new OmniCoin(
        _deploymentId,
        _coinName,
        _coinTicker,
        _coinDecimals,
        _coinTotalSupply,
        _receiver,
        _lzEndpoint
      )
    );
    setDeployedCoin(_deploymentId, _chainId, abi.encode(address(newCoin)));
  }

  function setOmniCoinTrustedRemote(
    bytes32 _deploymentId,
    uint16 _localChainId,
    uint16 _remoteChainId
  ) public {
    address remoteCoinAddress = getDeployedCoinAddress(
      _deploymentId,
      _remoteChainId
    );
    address localCoinAddress = getDeployedCoinAddress(
      _deploymentId,
      _localChainId
    );
    OmniCoin(payable(localCoinAddress)).setTrustedRemoteAddress(
      _remoteChainId,
      abi.encodePacked(remoteCoinAddress)
    );
    OmniCoin(payable(localCoinAddress)).setMinDstGas(_remoteChainId, 0, 200000);
    OmniCoin(payable(localCoinAddress)).setMinDstGas(_remoteChainId, 1, 200000);
  }
}
