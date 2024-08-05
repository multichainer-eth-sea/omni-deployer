// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ILayerZeroEndpoint} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";
import {NonblockingLzApp} from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OmniCoin} from "./OmniCoin.sol";
import "hardhat/console.sol";

enum CrossChainCommandId {
  DeployRemoteCoin,
  GossipRemoteCoin
}

struct CrossChainCommand {
  CrossChainCommandId _commandId;
  bytes _commandData;
}

struct GossipRemoteCoin {
  bytes _deployedRemoteCoinAddress;
  bytes _deployedRemoteCoinBytes;
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
  event RemoteCoinGossiped(uint16 indexed chainId, bytes remoteCoinData);
  event RemoteCoinGossipReceived(
    address indexed coinAddress,
    uint16 indexed remoteChainId,
    address indexed receiver,
    uint256 remoteSupplyAmount,
    address remoteFactoryAddress
  );

  uint256 internal constant gasForDestinationLzReceive = 3500000;

  bool public isGossipEnabled = false;

  constructor(
    address _endpoint
  ) NonblockingLzApp(_endpoint) Ownable(msg.sender) {}

  function setIsGossipEnabled(bool _isGossipEnabled) public onlyOwner {
    isGossipEnabled = _isGossipEnabled;
  }

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

      console.log("deploy succeed");
      console.log("chainId", lzEndpoint.getChainId());
      console.log("address(newCoin)", address(newCoin));

      if (isGossipEnabled) {
        _gossipNewCoin(
          _srcChainId,
          address(newCoin),
          coinData,
          payable(coinData._remoteConfig._receiver)
        );
      }

      return;
    }

    if (cmd._commandId == CrossChainCommandId.GossipRemoteCoin) {
      GossipRemoteCoin memory gossipData = abi.decode(
        cmd._commandData,
        (GossipRemoteCoin)
      );
      address coinAddress = abi.decode(
        gossipData._deployedRemoteCoinAddress,
        (address)
      );
      DeployRemoteCoin memory coinData = abi.decode(
        gossipData._deployedRemoteCoinBytes,
        (DeployRemoteCoin)
      );

      emit RemoteCoinGossipReceived(
        coinAddress,
        coinData._remoteConfig._remoteChainId,
        coinData._remoteConfig._receiver,
        coinData._remoteConfig._remoteSupplyAmount,
        coinData._remoteConfig._remoteFactoryAddress
      );

      return;
    }
  }

  // TODO(dims): implement this after multiple chain deployed implemented
  function _gossipNewCoin(
    uint16 _srcChainId,
    address _deployedCoinAddress,
    DeployRemoteCoin memory _deployedRemoteCoinData,
    address payable _receiver
  ) internal {
    GossipRemoteCoin memory gossipData = GossipRemoteCoin({
      _deployedRemoteCoinAddress: abi.encode(_deployedCoinAddress),
      _deployedRemoteCoinBytes: abi.encode(_deployedRemoteCoinData)
    });
    bytes memory gossipBytes = abi.encode(gossipData);
    bytes memory payload = _prepareCommandBytes(
      CrossChainCommandId.DeployRemoteCoin,
      gossipBytes
    );

    // TODO(dims): calculate native fee
    // uint16 _dstChainId,
    // bytes memory _payload,
    // address payable _refundAddress,
    // address _zroPaymentAddress,
    // bytes memory _adapterParams,
    // uint _nativeFee

    console.log("gossip status???");

    // TODO(dims): calculate native fee
    _lzSend(
      _srcChainId,
      payload,
      _receiver,
      address(0x0),
      _getAdapterParams(),
      0
    );

    console.log("gossip succeed");
    console.log("chainId", lzEndpoint.getChainId());
    // console.log("address(newCoin)", address(newCoin));
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
    nativeFees = new uint256[](_remoteConfigs.length);
    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      if (_remoteConfigs[i]._remoteChainId == lzEndpoint.getChainId()) {
        nativeFees[i] = 0;
      } else {
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

        uint256 deployFee = _calculateDeployCoinFee(
          _remoteConfigs[i]._remoteChainId,
          deployBytes
        );
        uint256 gossipFee = _calculateGossipCoinFee(
          _remoteConfigs[i]._remoteChainId,
          deployBytes
        );

        nativeFees[i] = deployFee + gossipFee;
      }
    }
  }

  function _calculateGossipCoinFee(
    uint16 _remoteChainId,
    bytes memory _deployBytes
  ) internal view returns (uint256 gossipNativeFee) {
    GossipRemoteCoin memory gossipData = GossipRemoteCoin({
      _deployedRemoteCoinAddress: abi.encode(address(0)),
      _deployedRemoteCoinBytes: abi.encode(_deployBytes)
    });
    bytes memory gossipBytes = abi.encode(gossipData);
    bytes memory payload = _prepareCommandBytes(
      CrossChainCommandId.DeployRemoteCoin,
      gossipBytes
    );

    (uint256 nativeFee, ) = lzEndpoint.estimateFees(
      _remoteChainId,
      address(this),
      payload,
      false,
      _getAdapterParams()
    );

    gossipNativeFee = nativeFee;
  }

  function _calculateDeployCoinFee(
    uint16 _remoteChainId,
    bytes memory _deployBytes
  ) internal view returns (uint256 deployNativeFee) {
    bytes memory payload = _prepareCommandBytes(
      CrossChainCommandId.DeployRemoteCoin,
      _deployBytes
    );

    (uint256 nativeFee, ) = lzEndpoint.estimateFees(
      _remoteChainId,
      address(this),
      payload,
      false,
      _getAdapterParams()
    );

    deployNativeFee = nativeFee;
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
      if (_remoteConfigs[i]._remoteChainId == lzEndpoint.getChainId()) {
        _deployLocalCoin(
          _coinName,
          _coinTicker,
          _coinDecimals,
          _remoteConfigs[i]._remoteSupplyAmount,
          _remoteConfigs[i]._receiver
        );
      } else {
        DeployRemoteCoin memory deployData = DeployRemoteCoin({
          _coinName: _coinName,
          _coinTicker: _coinTicker,
          _coinDecimals: _coinDecimals,
          _coinTotalSupply: _coinTotalSupply,
          _remoteConfig: _remoteConfigs[i]
        });
        bytes memory deployBytes = abi.encode(deployData);

        bytes memory payload = _prepareCommandBytes(
          CrossChainCommandId.DeployRemoteCoin,
          deployBytes
        );

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
  }

  function _prepareCommandBytes(
    CrossChainCommandId _commandId,
    bytes memory _commandData
  ) public pure returns (bytes memory cmdBytes) {
    CrossChainCommand memory cmd = CrossChainCommand({
      _commandId: _commandId,
      _commandData: _commandData
    });
    cmdBytes = abi.encode(cmd);
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
