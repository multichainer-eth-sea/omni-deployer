import {
  BridgeCoinParams,
  BridgeCoinReturns,
  DeployCoinReturns,
  DeployCoinSingleChainParams,
  DeployCoinMultiChainParams,
  DeployCoinReturnsReport,
  ICoinManager,
} from './types';
import { SdkSubModuleConstructorParams, CoinChain } from '../common';
import { ISdk } from '../types';

export class CoinManager implements ICoinManager {
  private sdk: ISdk;

  constructor(params: SdkSubModuleConstructorParams) {
    this.sdk = params.sdk;
  }

  public async deployCoinSingleChain(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturns> {
    return {
      coinName: params.coinName,
      coinTicker: params.coinTicker,
      coinTotalSupply: params.coinTotalSupply,
      coinDecimals: params.coinDecimals,
      txHashes: {
        [params.chain]: {
          chain: params.chain,
          amount: params.coinTotalSupply,
          receiptAddress: params.receiptAddress,
          txHash: '0x1234567890',
        },
      },
    };
  }

  public async deployCoinMultiChain(
    params: DeployCoinMultiChainParams,
  ): Promise<DeployCoinReturns> {
    const deployResultsPromises = params.chains.map(async (chainData) => {
      const client = this.sdk.getClient(chainData.chain);
      const deployResult = await client.deployCoin({
        chain: chainData.chain,
        coinName: params.coinName,
        coinTicker: params.coinTicker,
        coinTotalSupply: chainData.amount,
        coinDecimals: params.coinDecimals,
        receiptAddress: chainData.receiptAddress,
      });
      return deployResult;
    });
    const deployResults = await Promise.all(deployResultsPromises);

    const txHashes: Partial<Record<CoinChain, DeployCoinReturnsReport>> = {};

    deployResults.forEach((deployResult) => {
      const chain = deployResult.chain;
      txHashes[chain] = deployResult;
    });

    return {
      coinName: params.coinName,
      coinTicker: params.coinTicker,
      coinTotalSupply: params.coinTotalSupply,
      coinDecimals: params.coinDecimals,
      txHashes,
    };
  }

  public async bridgeCoin(
    params: BridgeCoinParams,
  ): Promise<BridgeCoinReturns> {
    return {
      fromChain: params.fromChain,
      toChain: params.toChain,
      coinAddress: params.coinAddress,
      amount: params.amount,
      receiptAddress: params.receiptAddress,
      bridgeProvider: params.bridgeProvider,
      bridgeTxHash: '0x1234567890',
    };
  }
}
