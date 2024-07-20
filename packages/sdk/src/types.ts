import { CoinChain } from './common';
import { IClientAdapter } from './client-adapter';
import { ICoinManager } from './coin-manager';
import { IWalletManager } from './wallet-manager';

export interface ISdk {
  readonly coin: ICoinManager;
  readonly wallet: IWalletManager;

  getClient(chain: CoinChain): IClientAdapter;
  getAllChains(): CoinChain[];
}
