import { CoinChain, SdkConstructorParams, ClientMap } from '../common';

import { GasBalance, GetGasBalancesReturns, IWalletManager } from './types';

export class WalletManager implements IWalletManager {
  private clientMap: ClientMap;

  constructor(params: SdkConstructorParams) {
    console.log('sdk constructor params:', params);
    this.clientMap = params.clientMap;
  }

  public async getGasBalance(chain: CoinChain): Promise<GasBalance> {
    console.log('getting gas balance for chain:', chain);
    return {
      chain,
      walletAddress: '0x1234567890',
      balance: '1000000000000000000',
      balanceUsd: '1000',
      gasTicker: 'ETH',
    };
  }

  public async getGasBalances(): Promise<GetGasBalancesReturns> {
    console.log('getting gas balances');
    return {
      [CoinChain.ARBITRUM]: {
        chain: CoinChain.ARBITRUM,
        walletAddress: '0x1234567890',
        balance: '1000000000000000000',
        balanceUsd: '1000',
        gasTicker: 'ETH',
      },
      [CoinChain.APTOS]: {
        chain: CoinChain.APTOS,
        walletAddress: '0x1234567890',
        balance: '1000000000000000000',
        balanceUsd: '1000',
        gasTicker: 'APT',
      },
      [CoinChain.SOLANA]: {
        chain: CoinChain.SOLANA,
        walletAddress: '0x1234567890',
        balance: '1000000000000000000',
        balanceUsd: '1000',
        gasTicker: 'SOL',
      },
    };
  }
}
