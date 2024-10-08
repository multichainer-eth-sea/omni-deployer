// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";
import {NonblockingLzApp} from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {OmniCoin} from "./OmniCoin.sol";
import {OmniFactoryStorage} from "./OmniFactoryStorage.sol";
// import "hardhat/console.sol";

enum CrossChainCommandId {
  DeployRemoteCoin,
  VerifyRemoteCoin
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
}

struct VerifyRemoteCoin {
  bytes32 _deploymentId;
  uint16 _chainId;
  bytes _deployedCoinAddress;
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
    uint16[] chainIds
  );
  event RemoteCoinVerified(
    bytes32 indexed deploymentId,
    address indexed creator,
    uint16[] chainIds
  );

  uint256 internal constant gasForDestinationLzReceive = 5_000_000;
  uint16 v1chainId;

  OmniFactoryStorage public factoryStorage;

  constructor(
    address _endpoint,
    uint16 _v1chainId,
    address _factoryStorage
  ) NonblockingLzApp(_endpoint) {
    v1chainId = _v1chainId;
    factoryStorage = OmniFactoryStorage(_factoryStorage);
  }

  function _generateDeploymentId(
    address _userAddress,
    uint16 _srcChainId,
    uint16[] memory _chainIds
  ) internal view returns (bytes32) {
    // uint256 nonce = userNonces[_userAddress];
    return
      keccak256(
        abi.encodePacked(
          _userAddress,
          _srcChainId,
          _chainIds,
          factoryStorage.getUserNonce(_userAddress)
        )
      );
  }

  function getChainId() public view returns (uint16) {
    return v1chainId;
  }

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
        coinData._deploymentId,
        coinData._coinName,
        coinData._coinTicker,
        coinData._coinDecimals,
        coinData._remoteConfig._remoteSupplyAmount,
        coinData._remoteConfig._receiver
      );

      return;
    }

    if (cmd._commandId == CrossChainCommandId.VerifyRemoteCoin) {
      VerifyRemoteCoin memory verifyData = abi.decode(
        cmd._commandData,
        (VerifyRemoteCoin)
      );

      factoryStorage.setDeployedCoin(
        verifyData._deploymentId,
        verifyData._chainId,
        verifyData._deployedCoinAddress
      );

      factoryStorage.setOmniCoinTrustedRemote(
        verifyData._deploymentId,
        v1chainId,
        verifyData._chainId
      );

      return;
    }
  }

  function verifyRemoteCoinDeployment(
    bytes32 _deploymentId,
    uint16[] memory _remoteChainIds,
    uint256[] memory _nativeFees
  ) public payable {
    bytes memory adapterParams = _getAdapterParams();

    for (uint256 i = 0; i < _remoteChainIds.length; i++) {
      if (_remoteChainIds[i] != v1chainId) {
        VerifyRemoteCoin memory verifyData = VerifyRemoteCoin({
          _deploymentId: _deploymentId,
          _chainId: v1chainId,
          _deployedCoinAddress: factoryStorage.getDeployedCoin(
            _deploymentId,
            v1chainId
          )
        });
        bytes memory verifyBytes = abi.encode(verifyData);

        bytes memory payload = _prepareCommandBytes(
          CrossChainCommandId.VerifyRemoteCoin,
          verifyBytes
        );

        _lzSend(
          _remoteChainIds[i],
          payload,
          payable(msg.sender),
          address(0x0),
          adapterParams,
          _nativeFees[i]
        );
      }
    }
  }

  function _deployLocalCoin(
    bytes32 _deploymentId,
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    address _receiver
  ) internal {
    address newCoin = factoryStorage.deployLocalCoin(
      _deploymentId,
      _coinName,
      _coinTicker,
      _coinDecimals,
      _coinTotalSupply,
      _receiver,
      address(lzEndpoint),
      v1chainId
    );
    emit LocalCoinDeployed(_deploymentId, newCoin, _receiver);
  }

  function estimateDeployFee(
    string memory _coinName,
    string memory _coinTicker,
    uint8 _coinDecimals,
    uint256 _coinTotalSupply,
    DeployRemoteCoinChainConfig[] memory _remoteConfigs
  ) public view returns (uint256[] memory nativeFees) {
    bytes memory adapterParams = _getAdapterParams();

    nativeFees = new uint256[](_remoteConfigs.length);
    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      if (_remoteConfigs[i]._remoteChainId == v1chainId) {
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
            _remoteSupplyAmount: _remoteConfigs[i]._remoteSupplyAmount
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

  function estimateVerifyFee(
    bytes32 _deploymentId,
    uint16[] memory _remoteChainIds
  ) public view returns (uint256[] memory nativeFees) {
    nativeFees = new uint256[](_remoteChainIds.length);

    bytes memory adapterParams = _getAdapterParams();

    for (uint256 i = 0; i < _remoteChainIds.length; i++) {
      if (_remoteChainIds[i] == v1chainId) {
        nativeFees[i] = 0;
      } else {
        VerifyRemoteCoin memory verifyData = VerifyRemoteCoin({
          _deploymentId: _deploymentId,
          _chainId: v1chainId,
          _deployedCoinAddress: factoryStorage.getDeployedCoin(
            _deploymentId,
            v1chainId
          )
        });
        bytes memory verifyBytes = abi.encode(verifyData);

        bytes memory payload = _prepareCommandBytes(
          CrossChainCommandId.VerifyRemoteCoin,
          verifyBytes
        );

        (uint256 nativeFee, ) = lzEndpoint.estimateFees(
          _remoteChainIds[i],
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
    uint256[] memory _nativeFees
  ) public payable {
    bytes memory adapterParams = _getAdapterParams();

    uint16[] memory chainIds = new uint16[](_remoteConfigs.length);
    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      chainIds[i] = _remoteConfigs[i]._remoteChainId;
    }
    bytes32 deploymentId = _generateDeploymentId(
      msg.sender,
      v1chainId,
      chainIds
    );

    factoryStorage.incrementUserNonce(msg.sender);

    for (uint256 i = 0; i < _remoteConfigs.length; i++) {
      if (_remoteConfigs[i]._remoteChainId == v1chainId) {
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
          _nativeFees[i]
        );
      }
    }
    emit RemoteCoinDeployed(deploymentId, msg.sender, chainIds);
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
