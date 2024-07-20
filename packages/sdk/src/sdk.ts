import { CoinManager, ICoinManager } from './coin-manager';
import { IWalletManager, WalletManager } from './wallet-manager';
import { ClientMap, CoinChain, SdkConstructorParams } from './common';
import { ISdk } from './types';

export class Sdk implements ISdk {
  private clientMap: ClientMap;
  public readonly coin: ICoinManager;
  public readonly wallet: IWalletManager;

  constructor(params: SdkConstructorParams) {
    this.clientMap = params.clientMap;

    this.coin = new CoinManager({ sdk: this });
    this.wallet = new WalletManager({ sdk: this });
  }

  public getClient(chain: CoinChain) {
    if (!this.clientMap[chain]) {
      throw new Error(`Client not found for chain: ${chain}`);
    }
    return this.clientMap[chain];
  }

  public getAllChains(): CoinChain[] {
    return Object.keys(this.clientMap) as CoinChain[];
  }
}
