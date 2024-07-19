import { CoinChain } from '../common';

export interface IWalletManager {
  getGasBalances(): Promise<GetGasBalancesReturns>;
  getGasBalance(chain: CoinChain): Promise<GasBalance>;
}

export type GasBalance = {
  chain: CoinChain;
  walletAddress: string;
  balance: string;
  balanceUsd: string;
  gasTicker: string;
};

export type GetGasBalancesReturns = Partial<Record<CoinChain, GasBalance>>;
