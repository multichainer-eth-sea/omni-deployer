import { Account } from '@aptos-labs/ts-sdk';
import { ethers } from 'ethers';
import { Connection, Keypair } from '@solana/web3.js';

export type NetworkMetadata = {
  blockExplorerUrl: string;
  gasTicker: string;
  gasDecimals: number;
  gasPriceCoingeckoId: string;
};

export type EvmClientAdapterConstructorParams = {
  ethersSigner: ethers.Signer;
  ethersProvider: ethers.Provider;
  networkMetadata: NetworkMetadata;
};

export type SolanaClientAdapterConstructorparams = {
  solanaConnection: Connection;
  solanaKeypair: Keypair;
  networkMetadata: NetworkMetadata;
};

export type AptosClientAdapterConstructorparams = {
  aptosAccount: Account;
  networkMetadata: NetworkMetadata;
};
