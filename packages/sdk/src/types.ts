import { CoinChain } from './common';
import { IClientAdapter } from './client-adapter';

export interface ISdk {
  getClient(chain: CoinChain): IClientAdapter;
  getAllChains(): CoinChain[];
}
