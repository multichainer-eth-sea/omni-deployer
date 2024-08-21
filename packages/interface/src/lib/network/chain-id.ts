import { arbitrum } from "viem/chains";

export enum EVMChainId {
  ARBITRUM = 42161,
  OPTIMISM = 10,
}
export const LZ_TO_EVM_CHAIN_ID: Record<number, number> = {
  110: EVMChainId.ARBITRUM,
  111: EVMChainId.OPTIMISM,
};

export const EVM_CHAIN_ID_TO_LZ: Record<number, number> = Object.fromEntries(
  Object.entries(LZ_TO_EVM_CHAIN_ID).map(([k, v]) => [v, parseInt(k)]),
);

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
    imgUrl: "https://cryptologos.cc/logos/arbitrum-arb-logo.png?v=033",
    explorerUrl: "https://arbiscan.io",
  },
  111: {
    name: "Optimism",
    chainId: EVMChainId.OPTIMISM,
    imgUrl: "https://icons.llamao.fi/icons/chains/rsz_optimism?w=48&h=48",
    explorerUrl: "https://optimistic.etherscan.io",
  },
};
