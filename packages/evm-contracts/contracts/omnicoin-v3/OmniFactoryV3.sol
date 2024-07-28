// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ILayerZeroEndpoint} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";
import {NonblockingLzApp} from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OmniCoinV3} from "./OmniCoinV3.sol";
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
  DeployRemoteCoinChainConfig _remoteConfigs;
}

struct DeployRemoteCoinChainConfig {
  uint16 _remoteChainId;
  address _receiver;
  uint256 _remoteSupplyAmount;
  address _remoteFactoryAddress;
}

contract OmniFactoryV3 is NonblockingLzApp {
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
    uint16,
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

      _deployLocalCoin(
        coinData._coinName,
        coinData._coinTicker,
        coinData._coinDecimals,
        coinData._remoteConfigs._remoteSupplyAmount,
        coinData._remoteConfigs._receiver
      );

      // _gossipNewCoin(newCoin);
      return;
    }

    if (cmd._commandId == CrossChainCommandId.GossipRemoteCoin) {
      // ...
    }
  }

  // TODO(dims): implement this after multiple chain deployed implemented
  function _gossipNewCoin(OmniCoinV3 _newCoin) internal {
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
  ) internal returns (OmniCoinV3 newCoin) {
    newCoin = new OmniCoinV3(
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
    address _receiver,
    uint16 _remoteChainId,
    address _remoteChainAddress
  ) public view returns (uint nativeFee, uint zroFee) {
    uint16 version = 1;
    bytes memory adapterParams = abi.encodePacked(
      version,
      gasForDestinationLzReceive
    );

    DeployRemoteCoin memory deployData = DeployRemoteCoin({
      _coinName: _coinName,
      _coinTicker: _coinTicker,
      _coinDecimals: _coinDecimals,
      _coinTotalSupply: _coinTotalSupply,
      _remoteConfigs: DeployRemoteCoinChainConfig({
        _remoteChainId: _remoteChainId,
        _receiver: _receiver,
        _remoteSupplyAmount: _coinTotalSupply,
        _remoteFactoryAddress: _remoteChainAddress
      })
    });
    bytes memory deployBytes = abi.encode(deployData);

    CrossChainCommand memory cmd = CrossChainCommand({
      _commandId: CrossChainCommandId.DeployRemoteCoin,
      _commandData: deployBytes
    });
    bytes memory payload = abi.encode(cmd);

    return
      lzEndpoint.estimateFees(
        _remoteChainId,
        address(this),
        payload,
        false,
        adapterParams
      );
  }

  function deployRemoteCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver,
    uint16 _remoteChainId,
    address _remoteChainAddress
  ) public payable {
    uint16 version = 1;
    bytes memory adapterParams = abi.encodePacked(
      version,
      gasForDestinationLzReceive
    );

    DeployRemoteCoin memory deployData = DeployRemoteCoin({
      _coinName: _coinName,
      _coinTicker: _coinTicker,
      _coinDecimals: _coinDecimals,
      _coinTotalSupply: _coinTotalSupply,
      _remoteConfigs: DeployRemoteCoinChainConfig({
        _remoteChainId: _remoteChainId,
        _receiver: _receiver,
        _remoteSupplyAmount: _coinTotalSupply,
        _remoteFactoryAddress: _remoteChainAddress
      })
    });
    bytes memory deployBytes = abi.encode(deployData);

    CrossChainCommand memory cmd = CrossChainCommand({
      _commandId: CrossChainCommandId.DeployRemoteCoin,
      _commandData: deployBytes
    });
    bytes memory payload = abi.encode(cmd);

    _lzSend(
      _remoteChainId,
      payload,
      payable(msg.sender),
      address(0x0),
      adapterParams,
      address(this).balance
    );

    emit RemoteCoinDeployed(_remoteChainAddress, msg.sender, _remoteChainId);
  }

  // allow this contract to receive ether
  receive() external payable {}
}
