import { CoinManager, ICoinManager } from './coin-manager';
import { IWalletManager, WalletManager } from './wallet-manager';
import { ClientMap, SdkConstructorParams } from './common';

export class Sdk {
  private clientMap: ClientMap;
  public readonly coin: ICoinManager;
  public readonly wallet: IWalletManager;

  constructor(params: SdkConstructorParams) {
    this.clientMap = params.clientMap;

    this.coin = new CoinManager({ clientMap: this.clientMap });
    this.wallet = new WalletManager({ clientMap: this.clientMap });
  }
}
