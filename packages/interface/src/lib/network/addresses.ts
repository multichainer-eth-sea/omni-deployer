import { Address } from "viem";
import { EVMChainId } from "./chain-id";

type AddressBook = Record<EVMChainId, OMNI_DEPLOYER_ADDRESSES>;

type OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: Address;
};

const ARBITRUM_ADDRESS_BOOK: OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: "0xa5FbAf70d0C96275392a732299c35F6159464dcd",
};

const OPTIMISM_ADDRESS_BOOK: OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: "0x784F9f5D23D5797b4E92E9A28704171a46f1776b",
};

const addressBook: AddressBook = {
  [EVMChainId.ARBITRUM]: ARBITRUM_ADDRESS_BOOK,
  [EVMChainId.OPTIMISM]: OPTIMISM_ADDRESS_BOOK,
};

export const getContractAddressForChainOrThrow = (
  chainId: EVMChainId,
): OMNI_DEPLOYER_ADDRESSES => {
  const addresses = addressBook[chainId];
  if (!addresses) {
    throw new Error(`Address not found for chain ${chainId}`);
  }
  return addresses;
};
