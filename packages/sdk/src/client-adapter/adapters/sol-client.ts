import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata } from './types';

export class SolClientAdapter implements IClientAdapter {
  public async getAddress(): Promise<string> {
    return '';
  }

  public async getGasBalance(): Promise<string> {
    return '';
  }

  public async getGasCoinData(): Promise<GetGasCoinDataReturns> {
    const ticker = this.getNetworkMetadata().gasTicker;
    return {
      ticker: ticker,
      priceUsd: '150',
    };
  }

  public getNetworkMetadata(): NetworkMetadata {
    return {
      gasTicker: 'SOL',
      blockExplorerUrl: 'https://solscan.io/',
      gasPriceCoingeckoId: 'solana',
      gasDecimals: 18,
    };
  }
}
