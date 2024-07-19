import { CoinChain, SdkConstructorParams, ClientMap } from '../common';

import { GasBalance, GetGasBalancesReturns, IWalletManager } from './types';

export class WalletManager implements IWalletManager {
  private clientMap: ClientMap;

  constructor(params: SdkConstructorParams) {
    this.clientMap = params.clientMap;
  }

  public async getGasBalance(chain: CoinChain): Promise<GasBalance> {
    if (!this.clientMap[chain]) {
      throw new Error(`Client not found for chain: ${chain}`);
    }

    const client = this.clientMap[chain];
    const gasBalance = await client.getGasBalance();
    const walletAddress = await client.getAddress();
    const gasCoinData = await client.getGasCoinData();
    const balanceUsd =
      parseFloat(gasBalance) * parseFloat(gasCoinData.priceUsd);

    return {
      chain,
      walletAddress: walletAddress,
      balance: gasBalance,
      balanceUsd: balanceUsd.toString(),
      gasTicker: gasCoinData.ticker,
    };
  }

  public async getGasBalances(): Promise<GetGasBalancesReturns> {
    const chains = Object.keys(this.clientMap);
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
