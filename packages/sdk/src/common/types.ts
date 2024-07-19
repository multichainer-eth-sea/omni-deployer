import { IClientAdapter } from '../client-adapter';

export enum CoinChain {
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  APTOS = 'aptos',
  SOLANA = 'solana',
}

export enum BridgeProvider {
  LAYERZERO = 'layerzero',
  WORMHOLE = 'wormhole',
}

export type SdkConstructorParams = {
  clientMap: ClientMap;
};

export type ClientMap = Partial<Record<CoinChain, IClientAdapter>>;
