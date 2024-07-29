// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ILayerZeroEndpoint} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";
import {NonblockingLzApp} from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OmniCoin} from "./OmniCoin.sol";
// import "hardhat/console.sol";

enum CrossChainCommandId {
  DeployRemoteCoin,
  GossipRemoteCoin
}

struct CrossChainCommand {
  CrossChainCommandId _commandId;
  bytes _commandData;
}

struct DeployRemoteCoin {
  string _coinName;
  string _coinTicker;
  uint8 _coinDecimals;
  uint256 _coinTotalSupply;
  DeployRemoteCoinChainConfig _remoteConfig;
}

struct DeployRemoteCoinChainConfig {
  uint16 _remoteChainId;
  address _receiver;
  uint256 _remoteSupplyAmount;
  address _remoteFactoryAddress;
}

contract OmniFactory is NonblockingLzApp {
  event LocalCoinDeployed(
    address indexed coinAddress,
    address indexed coinReceiver
  );
  event RemoteCoinDeployed(
    address indexed remoteFactoryAddress,
    address indexed creator,
    uint16 indexed chainId
  );

  uint256 internal constant gasForDestinationLzReceive = 3500000;

  constructor(
    address _endpoint
  ) NonblockingLzApp(_endpoint) Ownable(msg.sender) {}

  function _nonblockingLzReceive(
    uint16 _srcChainId,
    bytes memory,
    uint64,
    bytes memory _payload
  ) internal override {
    CrossChainCommand memory cmd = abi.decode(_payload, (CrossChainCommand));

    if (cmd._commandId == CrossChainCommandId.DeployRemoteCoin) {
      DeployRemoteCoin memory coinData = abi.decode(
        cmd._commandData,
        (DeployRemoteCoin)
      );

      OmniCoin newCoin = _deployLocalCoin(
        coinData._coinName,
        coinData._coinTicker,
        coinData._coinDecimals,
        coinData._remoteConfig._remoteSupplyAmount,
        coinData._remoteConfig._receiver
      );

      _gossipNewCoin(_srcChainId, address(newCoin), cmd._commandData);
      return;
    }

    if (cmd._commandId == CrossChainCommandId.GossipRemoteCoin) {
      // ...
    }
  }

  // TODO(dims): implement this after multiple chain deployed implemented
  function _gossipNewCoin(
    uint16 _srcChainId,
    address _deployedCoinAddress,
    bytes memory _deployedCoinData
  ) internal {
    // ...
  }

  function deployLocalCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply
  ) public {
    _deployLocalCoin(
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      msg.sender
    );
  }

  function _deployLocalCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver
  ) internal returns (OmniCoin newCoin) {
    newCoin = new OmniCoin(
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      _receiver
    );
    emit LocalCoinDeployed(address(newCoin), _receiver);
  }

  function estimateFee(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    DeployRemoteCoinChainConfig[] memory _remoteConfigs
  ) public view returns (uint256[] memory nativeFees) {
    bytes memory adapterParams = _getAdapterParams();

    nativeFees = new uint256[](_remoteConfigs.length);
    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      DeployRemoteCoin memory deployData = DeployRemoteCoin({
        _coinName: _coinName,
        _coinTicker: _coinTicker,
        _coinDecimals: _coinDecimals,
        _coinTotalSupply: _coinTotalSupply,
        _remoteConfig: DeployRemoteCoinChainConfig({
          _remoteChainId: _remoteConfigs[i]._remoteChainId,
          _receiver: _remoteConfigs[i]._receiver,
          _remoteSupplyAmount: _remoteConfigs[i]._remoteSupplyAmount,
          _remoteFactoryAddress: _remoteConfigs[i]._remoteFactoryAddress
        })
      });
      bytes memory deployBytes = abi.encode(deployData);

      CrossChainCommand memory cmd = CrossChainCommand({
        _commandId: CrossChainCommandId.DeployRemoteCoin,
        _commandData: deployBytes
      });
      bytes memory payload = abi.encode(cmd);

      (uint256 nativeFee, ) = lzEndpoint.estimateFees(
        _remoteConfigs[0]._remoteChainId,
        address(this),
        payload,
        false,
        adapterParams
      );

      nativeFees[i] = nativeFee;
    }
  }

  function deployRemoteCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    DeployRemoteCoinChainConfig[] memory _remoteConfigs,
    uint256[] memory nativeFees
  ) public payable {
    bytes memory adapterParams = _getAdapterParams();

    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      DeployRemoteCoin memory deployData = DeployRemoteCoin({
        _coinName: _coinName,
        _coinTicker: _coinTicker,
        _coinDecimals: _coinDecimals,
        _coinTotalSupply: _coinTotalSupply,
        _remoteConfig: _remoteConfigs[i]
      });
      bytes memory deployBytes = abi.encode(deployData);

      CrossChainCommand memory cmd = CrossChainCommand({
        _commandId: CrossChainCommandId.DeployRemoteCoin,
        _commandData: deployBytes
      });
      bytes memory payload = abi.encode(cmd);

      _lzSend(
        _remoteConfigs[i]._remoteChainId,
        payload,
        payable(msg.sender),
        address(0x0),
        adapterParams,
        nativeFees[i]
      );

      emit RemoteCoinDeployed(
        _remoteConfigs[i]._remoteFactoryAddress,
        msg.sender,
        _remoteConfigs[i]._remoteChainId
      );
    }
  }

  function _getAdapterParams()
    internal
    pure
    returns (bytes memory adapterParams)
  {
    uint16 version = 1;
    adapterParams = abi.encodePacked(version, gasForDestinationLzReceive);
  }

  // allow this contract to receive ether
  receive() external payable {}
}
