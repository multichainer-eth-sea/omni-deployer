// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

interface ILayerZeroEndpoint {
    // @notice send a LayerZero message to the specified address at a LayerZero endpoint.
    // @param _dstChainId - the destination chain identifier
    // @param _destination - the address on destination chain (in bytes). address length/format may vary by chains
    // @param _payload - a custom bytes payload to send to the destination contract
    // @param _refundAddress - if the source transaction is cheaper than the amount of value passed, refund the additional amount to this address
    // @param _zroPaymentAddress - the address of the ZRO token holder who would pay for the transaction
    // @param _adapterParams - parameters for custom functionality. e.g. receive airdropped native gas from the relayer on destination
    function send(
        uint16 _dstChainId,
        bytes calldata _destination,
        bytes calldata _payload,
        address payable _refundAddress,
        address _zroPaymentAddress,
        bytes calldata _adapterParams
    ) external payable;

    // @notice gets a quote in source native gas, for the amount that send() requires to pay for message delivery
    // @param _dstChainId - the destination chain identifier
    // @param _userApplication - the user app address on this EVM chain
    // @param _payload - the custom message to send over LayerZero
    // @param _payInZRO - if false, user app pays the protocol fee in native token
    // @param _adapterParam - parameters for the adapter service, e.g. send some dust native token to dstChain
    function estimateFees(
        uint16 _dstChainId, 
        address _userApplication, 
        bytes calldata _payload, 
        bool _payInZRO, 
        bytes calldata _adapterParam
    ) external view returns (uint nativeFee, uint zroFee);

    // @notice get this Endpoint's immutable source identifier
    function getChainId() external view returns (uint16);
}

interface ILayerZeroReceiver {
    // @notice LayerZero endpoint will invoke this function to deliver the message on the destination
    // @param _srcChainId - the source endpoint identifier
    // @param _srcAddress - the source sending contract address from the source chain
    // @param _nonce - the ordered message nonce
    // @param _payload - the signed payload is the UA bytes has encoded to be sent
    function lzReceive(
        uint16 _srcChainId,
        bytes calldata _srcAddress, 
        uint64 _nonce, 
        bytes calldata _payload
    ) external;
}

contract MyLayerZeroV1 is ILayerZeroReceiver  {
    ILayerZeroEndpoint public _lzEndpoint;

    event EndpointSendParams(
        uint16 _dstChainId,
        bytes _destination,
        bytes _payload,
        address _refundAddress,
        address _zroPaymentAddress,
        bytes _adapterParams
    );

    event EndpointReceiveParams(
        uint16 _srcChainId,
        bytes _srcAddress,
        uint64 _nonce,
        bytes _payload
    );

    string public lastMessage;
    mapping(uint16 => bytes) public trustedRemoteLookup;

    constructor(address lzEndpointAddress) {
        _lzEndpoint = ILayerZeroEndpoint(lzEndpointAddress);
    } 

    function saySomethingOmnichain(
        string memory message, 
        uint16 _dstChainId, 
        address remoteAddress
    ) public payable {
        bytes memory remoteAndLocalAddresses = abi.encodePacked(
            remoteAddress, 
            address(this)
        );
        _lzEndpoint.send{value: msg.value}(
            _dstChainId,
            remoteAndLocalAddresses,
            bytes(message), // payload
            payable(msg.sender),
            address(0x0),
            bytes("")
        );

        emit EndpointSendParams(
            _dstChainId,
            remoteAndLocalAddresses,
            bytes(message),
            msg.sender,
            address(0x0),
            bytes("")
        );
    }

    function estimateFeeSaySomethingOmnichain(
        string memory message, 
        uint16 _dstChainId
    ) public view returns (uint256 nativeFee, uint256 zroFee) {
        (nativeFee, zroFee) = _lzEndpoint.estimateFees(
            _dstChainId,
            address(this),
            bytes(message),
            false,
            bytes("")
        );
    }

    // override from ILayerZeroReceiver.sol
    function lzReceive(
        uint16 _srcChainId, // source chain id
        bytes memory _srcAddress,  // source sending contract address
        uint64 _nonce, // the ordered message nonce
        bytes memory _payload // the signed payload is the UA bytes has encoded to be sent
    ) override external {
        // require(keccak256(_srcAddress) == keccak256(trustedRemoteLookup[_srcChainId]);
        address fromAddress;
        assembly {
            fromAddress := mload(add(_srcAddress, 20))
        }
        lastMessage = string(_payload);

        emit EndpointReceiveParams(
            _srcChainId,
            _srcAddress,
            _nonce,
            _payload
        );
    }
}
