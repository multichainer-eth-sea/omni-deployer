import { NetworkMetadata } from './adapters/types';

export interface IClientAdapter {
  getGasBalance(): Promise<string>;
  getAddress(): Promise<string>;
  getGasCoinData(): Promise<GetGasCoinDataReturns>;
  getNetworkMetadata(): NetworkMetadata;
}

export type GetGasCoinDataReturns = {
  ticker: string;
  priceUsd: string;
};
