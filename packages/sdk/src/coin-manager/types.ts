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
  coinTotalSupply: string;
  coinDecimals: string;
};

export type DeployCoinSingleChainParams = DeployCoinParams & {
  chain: CoinChain;
  receiptAddress: string;
};

export type DeployCoinMultiChainParams = DeployCoinParams & {
  chains: DeployCoinChainConfig[];
};

export type DeployCoinChainConfig = {
  chain: CoinChain;
  amount: string;
  receiptAddress: string;
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
