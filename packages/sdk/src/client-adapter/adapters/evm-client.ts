import { ethers } from 'ethers';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { EvmClientAdapterConstructorParams, NetworkMetadata } from './types';

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
    return {
      ticker: this.networkMetadata.gasTicker,
      priceUsd: '3000', // TODO(dims): get the real price from coingecko
    };
  }

  public getChainExplorer(): string {
    return this.networkMetadata.blockExplorerUrl;
  }

  public getNetworkMetadata(): NetworkMetadata {
    return this.networkMetadata;
  }
}
