import { ethers } from 'ethers';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { EvmClientAdapterConstructorParams, NetworkMetadata } from './types';
import { getCoinPriceById } from '../../common/coin-price';
import {
  DeployCoinReturnsReport,
  DeployCoinSingleChainParams,
} from '../../coin-manager';
import { CoinChain } from '../../common';

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

  public async deployCoin(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturnsReport> {
    // TODO(dims): tidy up this

    const deployerAddress = this.getOmniDeployerAddress(params.chain);
    const deployerContract = new ethers.Contract(
      deployerAddress,
      ['function createOmniCoin(string,string,uint8,uint256) public'],
      this.ethersSigner,
    );
    const tx = await deployerContract.createOmniCoin(
      params.coinName,
      params.coinTicker,
      params.coinDecimals,
      params.coinTotalSupply,
    );
    const receipt = await tx.wait();
    const txHash = receipt.hash;

    return {
      chain: params.chain,
      amount: params.coinTotalSupply,
      receiptAddress: params.receiptAddress,
      txHash: txHash,
    };
  }

  private getOmniDeployerAddress(chain: CoinChain): string {
    const omnicoinDeployerAddressMap: Partial<Record<CoinChain, string>> = {
      [CoinChain.ARBITRUM]: '0x3c790c7f9ffa4c3290ed05df5cff39748b77dbf7',
      [CoinChain.OPTIMISM]: '0x08a0864095934625e27125Aa8E094C736aaF9fB7',
    };

    const deployerAddress = omnicoinDeployerAddressMap[chain];
    if (!deployerAddress) {
      throw new Error(`No deployer address found for chain ${chain}`);
    }

    return deployerAddress;
  }
}
