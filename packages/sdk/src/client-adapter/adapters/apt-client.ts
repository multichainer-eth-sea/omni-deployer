import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata } from './types';

export class AptClientAdapter implements IClientAdapter {
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
      priceUsd: '7.5',
    };
  }

  public getNetworkMetadata(): NetworkMetadata {
    return {
      gasTicker: 'APT',
      blockExplorerUrl: 'https://aptos.io',
      gasPriceCoingeckoId: 'aptos',
      gasDecimals: 18,
    };
  }
}
