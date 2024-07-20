import {
  BridgeCoinParams,
  BridgeCoinReturns,
  DeployCoinReturns,
  DeployCoinSingleChainParams,
  DeployCoinMultiChainParams,
  ICoinManager,
} from './types';
import { SdkConstructorParams, ClientMap } from '../common';

export class CoinManager implements ICoinManager {
  private clientMap: ClientMap;

  constructor(params: SdkConstructorParams) {
    this.clientMap = params.clientMap;
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
    return {
      coinName: params.coinName,
      coinTicker: params.coinTicker,
      coinTotalSupply: params.coinTotalSupply,
      coinDecimals: params.coinDecimals,
      txHashes: params.chains.reduce(
        (acc, chain) => ({
          ...acc,
          [chain.chain]: {
            chain: chain.chain,
            amount: chain.amount,
            receiptAddress: chain.receiptAddress,
            txHash: '0x1234567890',
          },
        }),
        {},
      ),
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
