import { ethers } from 'ethers';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { EvmClientAdapterConstructorParams, NetworkMetadata } from './types';
import { getCoinPriceById } from '../../common/coin-price';

export class EvmClientAdapter implements IClientAdapter {
  private ethersSigner: ethers.Signer;
  private ethersProvider: ethers.Provider;
  private networkMetadata: NetworkMetadata;

  constructor(params: EvmClientAdapterConstructorParams) {
    this.ethersSigner = params.ethersSigner;
    this.ethersProvider = params.ethersProvider;
    this.networkMetadata = params.networkMetadata;
  }

  public async getAddress(): Promise<string> {
    const address = await this.ethersSigner.getAddress();
    return address;
  }

  public async getGasBalance(): Promise<string> {
    const address = await this.getAddress();
    const balance = await this.ethersProvider.getBalance(address);
    const decimals = this.getNetworkMetadata().gasDecimals;

    const balanceFmt = ethers.formatUnits(balance, decimals);

    return balanceFmt;
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
