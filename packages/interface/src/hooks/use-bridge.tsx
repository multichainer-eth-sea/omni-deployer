import { OMNI_COIN_ABI } from "@/lib/abi/evm";
import { normalize, valueToBigInt } from "@/lib/common/bignumber";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Address,
  encodeAbiParameters,
  encodeFunctionData,
  encodePacked,
  parseAbiParameters,
} from "viem";
import { readContract } from "viem/actions";
import { useClient, useSendTransaction } from "wagmi";

const defaultAdapterParams = encodePacked(
  ["uint16", "uint256"],
  [1, valueToBigInt(200000)],
);
export function useEstimateSend({
  tokenAddress,
  outChainId,
  toAddress,
  amount,
}: {
  tokenAddress?: string;
  outChainId?: number;
  toAddress?: string;
  amount?: bigint;
}) {
  const client = useClient();
  return useQuery({
    queryKey: ["estimateSend"] as const,
    queryFn: async () => {
      if (!client) return;
      if (!tokenAddress) return;
      if (!outChainId) return;
      if (!toAddress) return;
      if (!amount) return;

      const data = await readContract(client, {
        address: tokenAddress as Address,
        abi: OMNI_COIN_ABI,
        functionName: "estimateSendFee",
        args: [
          outChainId,
          encodeAbiParameters(parseAbiParameters("address"), [
            toAddress as Address,
          ]),
          amount,
          false,
          defaultAdapterParams,
        ],
      });

      console.log("data", data);
      return {
        nativeFee: data[0],
        nativeFeeFmt: normalize(data[0].toString(), 18),
      };
    },
    enabled: !!client && !!outChainId && !!toAddress && !!amount,
  });
}

export function useSendFrom({
  tokenAddress,
  outChainId,
  toAddress,
  amount,
  nativeFee,
}: {
  tokenAddress?: string;
  outChainId?: number;
  toAddress?: string;
  amount?: bigint;
  nativeFee?: bigint;
}) {
  const { isPending, sendTransaction } = useSendTransaction();

  function sendFrom() {
    if (!tokenAddress) return;
    if (!outChainId) return;
    if (!toAddress) return;
    if (!amount) return;

    const data = encodeFunctionData({
      abi: OMNI_COIN_ABI,
      functionName: "sendFrom",
      args: [
        toAddress as Address,
        outChainId,
        encodeAbiParameters(parseAbiParameters("address"), [
          toAddress as Address,
        ]),
        amount,
        {
          refundAddress: toAddress as Address,
          zroPaymentAddress: "0x0000000000000000000000000000000000000000",
          adapterParams: defaultAdapterParams,
        },
      ],
    });

    sendTransaction({
      to: tokenAddress as Address,
      data,
      value: nativeFee ?? valueToBigInt(0),
    });
  }

  return {
    isPending,
    sendFrom,
  };
}
