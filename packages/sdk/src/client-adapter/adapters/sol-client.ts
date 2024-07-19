import { getCoinPriceById } from '../../common/coin-price';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata } from './types';

export class SolClientAdapter implements IClientAdapter {
  public async getAddress(): Promise<string> {
    return '';
  }

  public async getGasBalance(): Promise<string> {
    return '1';
  }

  public async getGasCoinData(): Promise<GetGasCoinDataReturns> {
    const { gasTicker, gasPriceCoingeckoId } = this.getNetworkMetadata();
    const priceUsd = await getCoinPriceById(`coingecko:${gasPriceCoingeckoId}`);
    return {
      ticker: gasTicker,
      priceUsd: priceUsd.toString(),
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
