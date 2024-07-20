import { NetworkMetadata } from './adapters/types';
import {
  DeployCoinReturnsReport,
  DeployCoinSingleChainParams,
} from '../coin-manager';

export interface IClientAdapter {
  getGasBalance(): Promise<string>;
  getAddress(): Promise<string>;
  getGasCoinData(): Promise<GetGasCoinDataReturns>;
  getNetworkMetadata(): NetworkMetadata;
  deployCoin(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturnsReport>;
}

export type GetGasCoinDataReturns = {
  ticker: string;
  priceUsd: string;
};
