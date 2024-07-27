// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;
import { ILayerZeroEndpoint } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroEndpoint.sol';
import { ILayerZeroReceiver } from '@layerzerolabs/solidity-examples/contracts/lzApp/interfaces/ILayerZeroReceiver.sol';
import { NonblockingLzApp } from '@layerzerolabs/solidity-examples/contracts/lzApp/NonblockingLzApp.sol';
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";

contract OmniFactoryV3 is NonblockingLzApp {
    constructor(address _endpoint) NonblockingLzApp(_endpoint) Ownable(msg.sender)  {}

    function _nonblockingLzReceive(
        uint16 _srcChainId,
        bytes memory,
        uint64,
        bytes memory _payload
    ) internal override {
        // ...
    }
}
