export interface IOmniDeployerSdk {
  deployCoinSingleChain(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturns>;
  deployCoinMultiChain(
    params: DeployCoinMultiChainParams,
  ): Promise<DeployCoinReturns>;
  bridgeCoin(params: BridgeCoinParams): Promise<DeployCoinReturns>;
}

export type BridgeCoinParams = {
  fromChain: CoinChain;
  toChain: CoinChain;
  amount: number;
  receiptAddress: string;
  bridgeProvider: BridgeProvider;
};

export type DeployCoinParams = {
  coinName: string;
  coinTicker: string;
  coinTotalSupply: number;
  coinDecimals: number;
};

export type DeployCoinSingleChainParams = DeployCoinParams & {
  chain: CoinChain;
  receiptAddress: string;
};

export type DeployCoinChainConfig = {
  chain: CoinChain;
  amount: number;
  receiptAddress: string;
};

export type DeployCoinMultiChainParams = DeployCoinParams & {
  chains: DeployCoinChainConfig[];
};

export enum CoinChain {
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  APTOS = 'aptos',
  SOLANA = 'solana',
}

export enum BridgeProvider {
  LAYERZERO = 'layerzero',
  WORMHOLE = 'wormhole',
}

export type DeployCoinReturns = void;
