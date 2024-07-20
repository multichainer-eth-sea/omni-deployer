import { getCoinPriceById } from '../../common/coin-price';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { AptosClientAdapterConstructorparams, NetworkMetadata } from './types';
import { Account, Aptos } from '@aptos-labs/ts-sdk';
import { normalizeBN, valueToBigNumber } from '../../common';

export class AptClientAdapter implements IClientAdapter {
  private networkMetadata: NetworkMetadata;
  private aptosClient: Aptos;
  private aptosAccount: Account;

  constructor(params: AptosClientAdapterConstructorparams) {
    this.networkMetadata = params.networkMetadata;

    this.aptosClient = params.aptosClient;
    this.aptosAccount = params.aptosAccount;
  }

  public async getAddress(): Promise<string> {
    const address = this.aptosAccount.accountAddress.toString();
    return address;
  }

  public async getGasBalance(): Promise<string> {
    const address = await this.getAddress();
    const balanceAllCoin = await this.aptosClient.getAccountCoinsData({
      accountAddress: address,
    });
    const metadata = balanceAllCoin.find(
      (coin) => coin?.asset_type === '0x1::aptos_coin::AptosCoin',
    );
    if (!metadata) return '0';

    const balanceBN = valueToBigNumber(metadata.amount);
    const decimals = this.getNetworkMetadata().gasDecimals;
    const balanceFmt = normalizeBN(balanceBN, decimals).toString();

    return balanceFmt;
  }

  public async getGasCoinData(): Promise<GetGasCoinDataReturns> {
    const { gasTicker, gasPriceCoingeckoId } = this.getNetworkMetadata();
    const priceUsd = await getCoinPriceById(`coingecko:${gasPriceCoingeckoId}`);
    return {
      ticker: gasTicker,
      priceUsd: priceUsd.toString(),
    };
  }

  public getNetworkMetadata(): NetworkMetadata {
    return this.networkMetadata;
  }
}
