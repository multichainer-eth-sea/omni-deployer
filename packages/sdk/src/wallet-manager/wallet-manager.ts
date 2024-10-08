import {
  CoinChain,
  SdkSubModuleConstructorParams,
  valueToBigNumber,
} from '../common';
import { GasBalance, GetGasBalancesReturns, IWalletManager } from './types';
import { ISdk } from '../types';

export class WalletManager implements IWalletManager {
  private sdk: ISdk;

  constructor(params: SdkSubModuleConstructorParams) {
    this.sdk = params.sdk;
  }

  public async getGasBalance(chain: CoinChain): Promise<GasBalance> {
    const client = this.sdk.getClient(chain);
    const gasBalance = await client.getGasBalance();
    const walletAddress = await client.getAddress();
    const gasCoinData = await client.getGasCoinData();
    const balanceUsd = valueToBigNumber(gasBalance)
      .multipliedBy(gasCoinData.priceUsd)
      .toFixed(2);

    return {
      chain,
      walletAddress: walletAddress,
      balance: gasBalance,
      balanceUsd: balanceUsd.toString(),
      gasTicker: gasCoinData.ticker,
    };
  }

  public async getGasBalances(): Promise<GetGasBalancesReturns> {
    const chains = this.sdk.getAllChains();
    const gasBalances = await Promise.all(
      chains.map(async (chain) => {
        return this.getGasBalance(chain as CoinChain);
      }),
    );
    const gasBalancesMap = gasBalances.reduce(
      (acc, gasBalance) => ({
        ...acc,
        [gasBalance.chain]: gasBalance,
      }),
      {} as GetGasBalancesReturns,
    );
    return gasBalancesMap;
  }
}
