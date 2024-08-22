import { Address } from "viem";
import { EVMChainId } from "./chain-id";

type AddressBook = Record<EVMChainId, OMNI_DEPLOYER_ADDRESSES>;

type OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: Address;
};

const ARBITRUM_ADDRESS_BOOK: OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: "0x33757f23Ec0AeCEa3Fd8B009b082fd27c81c488b",
};

const OPTIMISM_ADDRESS_BOOK: OMNI_DEPLOYER_ADDRESSES = {
  OMNI_FACTORY: "0x209C58E287B37d375410079Da2682881e1741a7C",
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
