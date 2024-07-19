import {
  BridgeCoinParams,
  DeployCoinReturns,
  DeployCoinSingleChainParams,
  DeployCoinMultiChainParams,
  IOmniDeployerSdk,
} from './types';

export class Sdk implements IOmniDeployerSdk {
  public async deployCoinSingleChain(
    params: DeployCoinSingleChainParams,
  ): Promise<DeployCoinReturns> {
    console.log('deploying coin at chain:', params.chain);
  }

  public async deployCoinMultiChain(
    params: DeployCoinMultiChainParams,
  ): Promise<DeployCoinReturns> {
    console.log(
      'deploying coin at chains:',
      params.chains.map((c) => c.chain),
    );
  }

  public async bridgeCoin(
    params: BridgeCoinParams,
  ): Promise<DeployCoinReturns> {
    console.log(
      'bridging coin from chain:',
      params.fromChain,
      'to chain:',
      params.toChain,
    );
  }
}
