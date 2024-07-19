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

export function prepareSolanaClient(blockExplorerUrl: string) {
  return new SolClientAdapter({
    networkMetadata: {
      gasTicker: 'SOL',
      blockExplorerUrl,
      gasDecimals: 18,
      gasPriceCoingeckoId: 'solana',
    },
  });
}

export function prepareAptosClient(blockExplorerUrl: string) {
  return new AptClientAdapter({
    networkMetadata: {
      gasTicker: 'APT',
      blockExplorerUrl,
      gasDecimals: 18,
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
    [CoinChain.SOLANA]: prepareSolanaClient('https://solscan.io/'),
    [CoinChain.APTOS]: prepareAptosClient('https://aptoscan.com/'),
  };

  const sdk = new Sdk({ clientMap });

  return sdk;
}
