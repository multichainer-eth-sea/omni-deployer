import { parseAbi } from "viem";

const OMNI_FACTORY_INTERFACE = [
  "struct DeployRemoteCoinChainConfig { uint16 _remoteChainId; address _receiver; uint256 _remoteSupplyAmount; }",
  "function estimateDeployFee( string _coinName, string _coinTicker, uint8 _coinDecimals, uint256 _coinTotalSupply, DeployRemoteCoinChainConfig[] _remoteConfigs) public view returns (uint256[] nativeFees)",
] as const;

export const OMNI_FACTORY_ABI = parseAbi(OMNI_FACTORY_INTERFACE);
