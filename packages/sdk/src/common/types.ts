import { IClientAdapter } from '../client-adapter';
import { ISdk } from '../types';

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

export type SdkSubModuleConstructorParams = {
  sdk: ISdk;
};

export type ClientMap = Partial<Record<CoinChain, IClientAdapter>>;
