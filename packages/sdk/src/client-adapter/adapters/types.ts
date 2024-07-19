import { ethers } from 'ethers';

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
