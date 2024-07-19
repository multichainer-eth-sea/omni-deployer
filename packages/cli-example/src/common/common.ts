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
    [CoinChain.SOLANA]: new SolClientAdapter(),
    [CoinChain.APTOS]: new AptClientAdapter(),
  };

  const sdk = new Sdk({ clientMap });

  return sdk;
}
