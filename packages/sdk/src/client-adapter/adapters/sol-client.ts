import { normalizeBN, valueToBigNumber } from '../../common';
import { getCoinPriceById } from '../../common/coin-price';
import { GetGasCoinDataReturns, IClientAdapter } from '../types';
import { NetworkMetadata, SolanaClientAdapterConstructorparams } from './types';
import { Keypair, Connection, PublicKey } from '@solana/web3.js';

export class SolClientAdapter implements IClientAdapter {
  private networkMetadata: NetworkMetadata;
  private solanaKeypair: Keypair;
  private solanaConnection: Connection;

  constructor(params: SolanaClientAdapterConstructorparams) {
    this.networkMetadata = params.networkMetadata;
    this.solanaKeypair = params.solanaKeypair;
    this.solanaConnection = params.solanaConnection;
  }

  public async getAddress(): Promise<string> {
    const address = this.getPublicKey().toString();
    return address;
  }

  public async getGasBalance(): Promise<string> {
    const balance = await this.solanaConnection.getBalance(this.getPublicKey());
    const balanceBN = valueToBigNumber(balance.toString());
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

  private getPublicKey(): PublicKey {
    return this.solanaKeypair.publicKey;
  }
}
