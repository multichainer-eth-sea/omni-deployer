import { getCoinPriceById } from '../../common/coin-price';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata } from './types';

export class AptClientAdapter implements IClientAdapter {
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
      gasTicker: 'APT',
      blockExplorerUrl: 'https://aptos.io',
      gasPriceCoingeckoId: 'aptos',
      gasDecimals: 18,
    };
  }
}
