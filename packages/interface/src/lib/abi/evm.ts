import { parseAbi } from "viem";

const OMNI_FACTORY_INTERFACE = [
  "struct DeployRemoteCoinChainConfig { uint16 _remoteChainId; address _receiver; uint256 _remoteSupplyAmount; }",
  "function estimateDeployFee( string _coinName, string _coinTicker, uint8 _coinDecimals, uint256 _coinTotalSupply, DeployRemoteCoinChainConfig[] _remoteConfigs) public view returns (uint256[] nativeFees)",
  "function deployRemoteCoin( string _coinName, string _coinTicker, uint8 _coinDecimals, uint256 _coinTotalSupply, DeployRemoteCoinChainConfig[] _remoteConfigs, uint256[] _nativeFees) public payable",
  "function estimateVerifyFee( bytes32 _deploymentId, uint16[] _remoteChainIds) public view returns (uint256[] nativeFees)",
  "function verifyRemoteCoinDeployment( bytes32 _deploymentId, uint16[] _remoteChainIds, uint256[] _nativeFees) public payable",
  "event RemoteCoinDeployed( bytes32 indexed deploymentId, address indexed creator, uint16[] chainIds)",
] as const;

export const OMNI_FACTORY_ABI = parseAbi(OMNI_FACTORY_INTERFACE);

const OMNI_COIN_INTERFACE = [
  "function estimateSendFee(uint16 _dstChainId, bytes32 _toAddress, uint _amount, bool _useZro, bytes _adapterParams) public view returns (uint nativeFee, uint zroFee)",
  "function sendFrom( address _from, uint16 _dstChainId, bytes32 _toAddress, uint _amount, LzCallParams _callParams) public payable",
  "struct LzCallParams { address refundAddress; address zroPaymentAddress; bytes adapterParams; }",
] as const;

export const OMNI_COIN_ABI = parseAbi(OMNI_COIN_INTERFACE);
