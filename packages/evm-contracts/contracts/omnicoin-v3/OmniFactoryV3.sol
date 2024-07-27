// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import { ILayerZeroEndpoint } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol';
import { ILayerZeroReceiver } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol';
import { NonblockingLzApp } from '@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol';
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OmniCoinV3 } from "./OmniCoinV3.sol";
// import "hardhat/console.sol";

contract OmniFactoryV3 is NonblockingLzApp {
    event LocalCoinDeployed(address indexed coinAddress, address indexed coinReceiver);
    event RemoteCoinDeployed(address indexed remoteFactoryAddress, address indexed creator, uint16 indexed chainId);

    constructor(address _endpoint) NonblockingLzApp(_endpoint) Ownable(msg.sender)  {}

    function _nonblockingLzReceive(
        uint16,
        bytes memory,
        uint64,
        bytes memory _payload
    ) internal override {
        (
            string memory coinName,
            string memory coinTicker,
            uint8 coinDecimals,
            uint256 coinTotalSupply,
            address receiver
        ) = abi.decode(_payload, (string, string, uint8, uint256, address));

        _deployLocalCoin(coinName, coinTicker, coinDecimals, coinTotalSupply, receiver);
    }

    function deployLocalCoin(
        string memory coinName,
        string memory coinTicker,
        uint8 coinDecimals,
        uint256 coinTotalSupply
    ) public {
        _deployLocalCoin(coinName, coinTicker, coinDecimals, coinTotalSupply, msg.sender);
    }

    function _deployLocalCoin(
        string memory coinName,
        string memory coinTicker,
        uint8 coinDecimals,
        uint256 coinTotalSupply,
        address receiver
    ) internal {
        OmniCoinV3 newCoin = new OmniCoinV3(
            coinName,
            coinTicker,
            coinDecimals,
            coinTotalSupply,
            receiver
        );
        emit LocalCoinDeployed(address(newCoin), receiver);
    }

    function estimateFee(
        string memory coinName,
        string memory coinTicker,
        uint8 coinDecimals,
        uint256 coinTotalSupply,
        address receiver,
        uint16 remoteChainId
    ) public view returns (uint nativeFee, uint zroFee) {
        uint16 version = 1;
        uint256 gasForDestinationLzReceive = 3500000;
        bytes memory adapterParams = abi.encodePacked(version, gasForDestinationLzReceive);

        bytes memory payload = abi.encode(
            coinName, 
            coinTicker, 
            coinDecimals, 
            coinTotalSupply,
            receiver
        );
        return lzEndpoint.estimateFees(remoteChainId, address(this), payload, false, adapterParams);
    }

    function deployRemoteCoin(
        string memory coinName,
        string memory coinTicker,
        uint8 coinDecimals,
        uint256 coinTotalSupply,
        address receiver,
        uint16 remoteChainId,
        address remoteChainAddress
    ) public payable {
        bytes memory payload = abi.encode(
            coinName, 
            coinTicker, 
            coinDecimals, 
            coinTotalSupply,
            receiver
        );

        uint16 version = 1;
        uint256 gasForDestinationLzReceive = 3500000;
        bytes memory adapterParams = abi.encodePacked(version, gasForDestinationLzReceive);

        _lzSend(
            remoteChainId,
            payload,
            payable(msg.sender),
            address(0x0),
            adapterParams,
            address(this).balance
        );

        emit RemoteCoinDeployed(remoteChainAddress, msg.sender, remoteChainId);
    }

    // allow this contract to receive ether
    receive() external payable {}

}
