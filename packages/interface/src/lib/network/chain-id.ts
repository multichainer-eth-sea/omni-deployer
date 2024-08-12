export enum EVMChainId {
  ARBITRUM = 42161,
  OPTIMISM = 10,
}
export const LZ_TO_EVM_CHAIN_ID: Record<number, number> = {
  110: EVMChainId.ARBITRUM,
  111: EVMChainId.OPTIMISM,
};

// https://icons.llamao.fi/icons/chains/rsz_base?w=48&h=48

export const lzChainMetadata: Record<
  number,
  {
    name: string;
    chainId: number;
    imgUrl: string;
    explorerUrl: string;
  }
> = {
  110: {
    name: "Arbitrum",
    chainId: EVMChainId.ARBITRUM,
    imgUrl: "https://icons.llamao.fi/icons/chains/rsz_arbitrum?w=48&h=48",
    explorerUrl: "https://arbiscan.io",
  },
  111: {
    name: "Optimism",
    chainId: EVMChainId.OPTIMISM,
    imgUrl: "https://icons.llamao.fi/icons/chains/rsz_optimism?w=48&h=48",
    explorerUrl: "https://optimistic.etherscan.io",
  },
};
