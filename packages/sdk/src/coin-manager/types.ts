import { CoinChain, BridgeProvider } from '../common';

export interface ICoinManager {
  deployCoinSingleChain(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturns>;
  deployCoinMultiChain(
    params: DeployCoinMultiChainParams,
  ): Promise<DeployCoinReturns>;
  bridgeCoin(params: BridgeCoinParams): Promise<BridgeCoinReturns>;
}

export type BridgeCoinParams = {
  fromChain: CoinChain;
  toChain: CoinChain;
  coinAddress: string;
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

export type DeployCoinReturnsReport = DeployCoinChainConfig & {
  txHash: string;
};

export type DeployCoinReturns = DeployCoinParams & {
  txHashes: Partial<Record<CoinChain, DeployCoinReturnsReport>>;
};

export type BridgeCoinReturns = BridgeCoinParams & {
  bridgeTxHash: string;
};
