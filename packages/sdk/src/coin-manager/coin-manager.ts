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
    console.log('sdk constructor params:', params);
    this.clientMap = params.clientMap;
  }

  public async deployCoinSingleChain(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturns> {
    console.log('deploying coin at chain:', params.chain);
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
    console.log(
      'deploying coin at chains:',
      params.chains.map((c) => c.chain),
    );
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
    console.log(
      'bridging coin from chain:',
      params.fromChain,
      'to chain:',
      params.toChain,
    );
    return {
      fromChain: params.fromChain,
      toChain: params.toChain,
      amount: params.amount,
      receiptAddress: params.receiptAddress,
      bridgeProvider: params.bridgeProvider,
      bridgeTxHash: '0x1234567890',
    };
  }
}
