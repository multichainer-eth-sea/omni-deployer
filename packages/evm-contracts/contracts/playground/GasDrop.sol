// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import {ILayerZeroEndpoint} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol";
import {ILayerZeroReceiver} from "@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol";
import {NonblockingLzApp} from "@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

// import "hardhat/console.sol";

struct EtherDropDetail {
  uint16 _fromChainId;
  uint16 _toChainId;
  address _fromAddress;
  address _toAddress;
  uint256 _totalEthers;
}

contract GasDrop is NonblockingLzApp {
  event EtherDropSent(
    uint16 _fromChainId,
    uint16 _toChainId,
    address _fromAddress,
    address _toAddress,
    uint256 _totalEthers
  );

  event EtherDropReceived(
    uint16 _fromChainId,
    uint16 _toChainId,
    address _fromAddress,
    address _toAddress,
    uint256 _totalEthers
  );

  event EtherReceivedViaReceiveFunction(uint256 _amount);
  event EtherReceivedViaFallbackFunction(uint256 _amount);

  uint256 public maxGasLimit = 200_000;
  function setMaxGasLimit(uint256 _maxGasLimit) public onlyOwner {
    maxGasLimit = _maxGasLimit;
  }

  constructor(
    address _endpoint
  ) NonblockingLzApp(_endpoint) Ownable(msg.sender) {}

  function _nonblockingLzReceive(
    uint16 /* _srcChainId */,
    bytes memory /* _srcAddress */,
    uint64 /* _nonce */,
    bytes memory _payload
  ) internal override {
    EtherDropDetail memory etherDropDetail = abi.decode(
      _payload,
      (EtherDropDetail)
    );
    payable(etherDropDetail._toAddress).transfer(etherDropDetail._totalEthers);

    emit EtherDropReceived(
      etherDropDetail._fromChainId,
      etherDropDetail._toChainId,
      etherDropDetail._fromAddress,
      etherDropDetail._toAddress,
      etherDropDetail._totalEthers
    );
  }

  function sendEtherOmnichain(
    uint16 _chainId,
    uint256 _totalEthers,
    address _addressOnDest
  ) public payable {
    bytes memory adapterParams = constructAdapterParams(
      2,
      maxGasLimit,
      _totalEthers,
      _addressOnDest
    );
    bytes memory payload = constructPayload(
      _chainId,
      _addressOnDest,
      _totalEthers
    );
    uint256 nativeFee = estimateFees(_chainId, _totalEthers, _addressOnDest);

    _lzSend(
      _chainId,
      payload,
      payable(msg.sender),
      address(0x0), // zroPaymentAddress
      adapterParams,
      nativeFee
    );

    emit EtherDropSent(
      lzEndpoint.getChainId(),
      _chainId,
      msg.sender,
      _addressOnDest,
      _totalEthers
    );
  }

  function estimateFees(
    uint16 _chainId,
    uint256 _totalEthers,
    address _addressOnDest
  ) public view returns (uint256) {
    bytes memory adapterParams = constructAdapterParams(
      2,
      maxGasLimit,
      _totalEthers,
      _addressOnDest
    );
    bytes memory payload = constructPayload(
      _chainId,
      address(this),
      _totalEthers
    );
    (uint256 nativeFee, ) = lzEndpoint.estimateFees(
      _chainId,
      payable(msg.sender),
      payload,
      false,
      adapterParams
    );

    return nativeFee;
  }

  function estimateFeesWithTotalEthers(
    uint16 _chainId,
    uint256 _totalEthers,
    address _addressOnDest
  ) public view returns (uint256 totalEthersSent) {
    uint256 nativeFee = estimateFees(_chainId, _totalEthers, _addressOnDest);
    totalEthersSent = _totalEthers + nativeFee;
  }

  function constructPayload(
    uint16 _chainId,
    address _toAddress,
    uint256 _totalEthers
  ) public view returns (bytes memory payload) {
    EtherDropDetail memory etherDropDetail = EtherDropDetail({
      _fromChainId: lzEndpoint.getChainId(),
      _toChainId: _chainId,
      _fromAddress: msg.sender,
      _toAddress: _toAddress,
      _totalEthers: _totalEthers
    });
    payload = abi.encode(etherDropDetail);
  }

  function constructAdapterParams(
    uint16 _version,
    uint256 _gasOnDest,
    uint256 _totalEthers,
    address _addressOnDest
  ) public pure returns (bytes memory adapterParams) {
    adapterParams = abi.encodePacked(
      _version,
      _gasOnDest,
      _totalEthers,
      _addressOnDest
    );
  }

  // allow this contract to receive ether
  receive() external payable {
      emit EtherReceivedViaReceiveFunction(msg.value);
  }

  fallback() external payable {
      emit EtherReceivedViaFallbackFunction(msg.value);
  }
}
