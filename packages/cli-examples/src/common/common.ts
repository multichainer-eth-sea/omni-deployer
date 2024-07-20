import {
  AptClientAdapter,
  ClientMap,
  CoinChain,
  EvmClientAdapter,
  Sdk,
  SolClientAdapter,
} from '@omni-deployer/sdk';
import { ethers } from 'ethers';
import { config } from '../config';
import {
  Account,
  Aptos,
  AptosConfig,
  Ed25519PrivateKey,
  Network,
} from '@aptos-labs/ts-sdk';
import web3 from '@solana/web3.js';
import bs58 from 'bs58';

export function prepareEvmClient(
  rpcUrl: string,
  privateKey: string,
  blockExplorerUrl: string,
) {
  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const signer = new ethers.Wallet(privateKey, provider);

  return new EvmClientAdapter({
    ethersProvider: provider,
    ethersSigner: signer,
    networkMetadata: {
      gasTicker: 'ETH',
      blockExplorerUrl: blockExplorerUrl,
      gasDecimals: 18,
      gasPriceCoingeckoId: 'ethereum',
    },
  });
}

export function prepareSolanaClient(
  privateKey: string,
  blockExplorerUrl: string,
) {
  const connection = new web3.Connection(
    web3.clusterApiUrl('mainnet-beta'),
    'confirmed',
  );
  const secretKey = bs58.decode(privateKey);
  const keypair = web3.Keypair.fromSecretKey(secretKey);
  return new SolClientAdapter({
    solanaConnection: connection,
    solanaKeypair: keypair,
    networkMetadata: {
      gasTicker: 'SOL',
      blockExplorerUrl,
      gasDecimals: 9,
      gasPriceCoingeckoId: 'solana',
    },
  });
}

export function prepareAptosClient(
  privateKey: string,
  blockExplorerUrl: string,
) {
  const aptosAccount = Account.fromPrivateKey({
    privateKey: new Ed25519PrivateKey(privateKey),
  });
  const aptosClient = new Aptos(new AptosConfig({ network: Network.MAINNET }));

  return new AptClientAdapter({
    aptosClient,
    aptosAccount,
    networkMetadata: {
      gasTicker: 'APT',
      blockExplorerUrl,
      gasDecimals: 8,
      gasPriceCoingeckoId: 'aptos',
    },
  });
}

export function prepareSdk() {
  const clientMap: ClientMap = {
    [CoinChain.ARBITRUM]: prepareEvmClient(
      'https://arbitrum.llamarpc.com',
      config.ARBITRUM_PRIVATE_KEY,
      'https://arbiscan.io/',
    ),
    [CoinChain.OPTIMISM]: prepareEvmClient(
      'https://optimism.llamarpc.com',
      config.ARBITRUM_PRIVATE_KEY,
      'https://optimistic.etherscan.io/',
    ),
    [CoinChain.SOLANA]: prepareSolanaClient(
      config.SOLANA_PRIVATE_KEY,
      'https://solscan.io/',
    ),
    [CoinChain.APTOS]: prepareAptosClient(
      config.APTOS_PRIVATE_KEY,
      'https://aptoscan.com/',
    ),
  };

  const sdk = new Sdk({ clientMap });

  return sdk;
}
