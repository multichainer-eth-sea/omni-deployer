export enum EVMChainId {
  ARBITRUM = "42161",
  OPTIMISM = "10",
}

export const LZ_CHAIN_ID: Record<EVMChainId, string> = {
  [EVMChainId.ARBITRUM]: "110",
  [EVMChainId.OPTIMISM]: "111",
};
