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
  bytes32 _deploymentId;
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
    bytes32 indexed deploymentId,
    address indexed coinAddress,
    address indexed coinReceiver
  );
  event RemoteCoinDeployed(
    bytes32 indexed deploymentId,
    address indexed creator,
    address[] remoteFactoryAddress,
    uint16[] chainIds
  );

  uint256 internal constant gasForDestinationLzReceive = 3500000;

  // deployedCoins[bytes32(deploymentId)][uint16(chainId)] = address(coin)
  mapping(bytes => mapping(uint16 => bytes)) public deployedCoins;

  // mapping of user nonces
  mapping(address => uint256) public userNonces;

  constructor(
    address _endpoint
  ) NonblockingLzApp(_endpoint) Ownable(msg.sender) {}

  function _generateDeploymentId(
    address _userAddress,
    uint16 _srcChainId,
    uint16[] memory _chainIds
  ) internal view returns (bytes32) {
    uint256 nonce = userNonces[_userAddress];
    return
      keccak256(abi.encodePacked(_userAddress, _srcChainId, _chainIds, nonce));
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

      _deployLocalCoin(
        coinData._deploymentId,
        coinData._coinName,
        coinData._coinTicker,
        coinData._coinDecimals,
        coinData._remoteConfig._remoteSupplyAmount,
        coinData._remoteConfig._receiver
      );
    }

    if (cmd._commandId == CrossChainCommandId.GossipRemoteCoin) {
      // ...
    }
  }

  function deployLocalCoin(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply
  ) public {
    uint16[] memory chainIds = new uint16[](1);
    chainIds[0] = lzEndpoint.getChainId();
    bytes32 deploymentId = _generateDeploymentId(
      msg.sender,
      lzEndpoint.getChainId(),
      chainIds
    );
    _deployLocalCoin(
      deploymentId,
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      msg.sender
    );
  }

  function _deployLocalCoin(
    bytes32 _deploymentId,
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver
  ) internal returns (OmniCoin newCoin) {
    newCoin = new OmniCoin(
      _deploymentId,
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      _receiver
    );
    emit LocalCoinDeployed(_deploymentId, address(newCoin), _receiver);
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
      if (_remoteConfigs[i]._remoteChainId == lzEndpoint.getChainId()) {
        nativeFees[i] = 0;
      } else {
        DeployRemoteCoin memory deployData = DeployRemoteCoin({
          _deploymentId: bytes32(0),
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

        bytes memory payload = _prepareCommandBytes(
          CrossChainCommandId.DeployRemoteCoin,
          deployBytes
        );

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

    uint16[] memory chainIds = new uint16[](_remoteConfigs.length);
    address[] memory remoteFactoryAddresses = new address[](
      _remoteConfigs.length
    );
    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      chainIds[i] = _remoteConfigs[i]._remoteChainId;
      remoteFactoryAddresses[i] = _remoteConfigs[i]._remoteFactoryAddress;
    }
    bytes32 deploymentId = _generateDeploymentId(
      msg.sender,
      lzEndpoint.getChainId(),
      chainIds
    );

    userNonces[msg.sender] += 1;

    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      if (_remoteConfigs[i]._remoteChainId == lzEndpoint.getChainId()) {
        _deployLocalCoin(
          deploymentId,
          _coinName,
          _coinTicker,
          _coinDecimals,
          _remoteConfigs[i]._remoteSupplyAmount,
          _remoteConfigs[i]._receiver
        );
      } else {
        DeployRemoteCoin memory deployData = DeployRemoteCoin({
          _deploymentId: deploymentId,
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
      }
    }
    emit RemoteCoinDeployed(
      deploymentId,
      msg.sender,
      remoteFactoryAddresses,
      chainIds
    );
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
