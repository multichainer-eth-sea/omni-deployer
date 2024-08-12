import { Address, Hex } from "viem";

export type SendTransactionParams = {
  to: Address;
  data: Hex;
  value?: bigint;
};
