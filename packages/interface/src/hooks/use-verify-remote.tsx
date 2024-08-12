import { useAccount, useClient, useSendTransaction } from "wagmi";
import { readContract } from "viem/actions";
import { getContractAddressForChainOrThrow } from "@/lib/network/addresses";
import { OMNI_FACTORY_ABI } from "@/lib/abi/evm";
import { encodeFunctionData, Hex, keccak256 } from "viem";
import { useQuery } from "@tanstack/react-query";
import { valueToBigInt } from "@/lib/common/bignumber";

export function useVerifyRemote(deploymentId: string) {
  const {
    data: hash,
    sendTransaction,
    isPending,
    isError,
    isSuccess,
  } = useSendTransaction();

  const { chainId: inboundChainId } = useAccount();

  async function verifyRemoteCoinDeployment(
    chainIds: number[],
    nativeFees: bigint[],
    onSuccess: (hash: string) => void,
  ) {
    if (!inboundChainId) {
      return;
    }

    const { OMNI_FACTORY } = getContractAddressForChainOrThrow(inboundChainId);

    const data = encodeFunctionData({
      abi: OMNI_FACTORY_ABI,
      functionName: "verifyRemoteCoinDeployment",
      args: [deploymentId as Hex, chainIds, nativeFees],
    });

    sendTransaction(
      {
        to: OMNI_FACTORY,
        data,
        value: nativeFees.reduce((acc, cur) => acc + cur, valueToBigInt(0)),
      },
      {
        onSuccess,
      },
    );
  }

  return {
    hash,
    verifyRemoteCoinDeployment,
    isPending,
    isError,
    isSuccess,
  };
}

export function useEstimateVerifyOFT(deploymentId: string, chainIds: number[]) {
  const client = useClient();
  const { chainId: inboundChainId } = useAccount();

  return useQuery({
    queryKey: ["estimate-verify-oft", inboundChainId, chainIds],
    queryFn: async () => {
      if (!inboundChainId) {
        return;
      }

      const { OMNI_FACTORY } =
        getContractAddressForChainOrThrow(inboundChainId);
      if (!client) {
        return;
      }

      const data = await readContract(client, {
        address: OMNI_FACTORY,
        abi: OMNI_FACTORY_ABI,
        functionName: "estimateVerifyFee",
        args: [deploymentId as Hex, chainIds],
      });

      return data;
    },
  });
}
