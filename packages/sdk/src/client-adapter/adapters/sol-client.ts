import { getCoinPriceById } from '../../common/coin-price';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata, SolanaClientAdapterConstructorparams } from './types';

export class SolClientAdapter implements IClientAdapter {
  private networkMetadata: NetworkMetadata;

  constructor(params: SolanaClientAdapterConstructorparams) {
    this.networkMetadata = params.networkMetadata;
  }

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
    return this.networkMetadata;
  }
}
