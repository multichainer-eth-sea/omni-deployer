// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import { ILayerZeroEndpoint } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol';
import { ILayerZeroReceiver } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol';
import { NonblockingLzApp } from '@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol';
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { OmniCoinV3 } from "./OmniCoinV3.sol";

contract OmniFactoryV3 is NonblockingLzApp {
    event LocalCoinDeployed(address indexed coinAddress, address indexed coinReceiver);

    constructor(address _endpoint) NonblockingLzApp(_endpoint) Ownable(msg.sender)  {}

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory,
        uint64,
        bytes memory _payload
    ) internal override {
        // ...
    }

    function deployLocalCoin(
        string memory coinName,
        string memory coinTicker,
        uint8 coinDecimals,
        uint256 coinTotalSupply
    ) external {
        OmniCoinV3 newCoin = new OmniCoinV3(
            coinName,
            coinTicker,
            coinDecimals,
            coinTotalSupply,
            msg.sender
        );
        emit LocalCoinDeployed(address(newCoin), msg.sender);
    }
}
