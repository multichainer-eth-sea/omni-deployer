import { OMNI_FACTORY_ABI } from "@/lib/abi/evm";
import {
  BigNumberValue,
  normalize,
  valueToBigInt,
  valueToBigNumber,
} from "@/lib/common/bignumber";
import { SendTransactionParams } from "@/lib/common/encoding";
import { getContractAddressForChainOrThrow } from "@/lib/network/addresses";
import { useQuery } from "@tanstack/react-query";
import { Address, Client, encodeFunctionData } from "viem";
import { readContract } from "viem/actions";
import { useAccount, useClient } from "wagmi";

export function useSimulateDeployOFT(
  remoteDeploymentConfigs: RemoteDeploymentConfig[],
) {
  const { address: userAddress, chainId } = useAccount();
  const client = useClient();
  return useQuery({
    queryKey: ["simulateDeployOFT", remoteDeploymentConfigs] as const,
    queryFn: async () => {
      if (!client) {
        return;
      }

      if (!chainId) {
        return;
      }

      const totalSupply = remoteDeploymentConfigs.reduce(
        (acc, config) => acc.plus(config.remoteSupplyAmount),
        valueToBigNumber(0),
      );

      return estimateDeployFee(chainId, client, {
        tokenName: "OMNI EXAMPLE",
        tokenSymbol: "EXAMP",
        decimal: 18,
        totalSupplyBN: totalSupply,
        remoteConfigs: remoteDeploymentConfigs,
      });
    },
    enabled: !!userAddress && !!client,
  });
}

export function deployOFT(
  chainId: number,
  params: DeployOFTParams,
): SendTransactionParams {
  const { OMNI_FACTORY } = getContractAddressForChainOrThrow(chainId);

  const data = encodeFunctionData({
    abi: OMNI_FACTORY_ABI,
    functionName: "deployRemoteCoin",
    args: [
      params.tokenName,
      params.tokenSymbol,
      Number(params.decimal),
      valueToBigInt(params.totalSupplyBN),
      params.remoteConfigs.map((config) => ({
        _remoteChainId: config.remoteChainId,
        _receiver: config.receiver as Address,
        _remoteSupplyAmount: valueToBigInt(config.remoteSupplyAmount),
      })),
      params.nativeFees.map(valueToBigInt),
    ],
  });

  const totalNativeFees = params.nativeFees.reduce(
    (acc, fee) => acc + valueToBigInt(fee),
    valueToBigInt(0),
  );

  return {
    to: OMNI_FACTORY,
    data,
    value: totalNativeFees,
  };
}

export async function estimateDeployFee(
  chainId: number,
  client: Client,
  params: EstimateDeployOFTParams,
): Promise<RemoteDeploymentFee[]> {
  const { OMNI_FACTORY } = getContractAddressForChainOrThrow(chainId);

  const nativeFees = await readContract(client, {
    address: OMNI_FACTORY,
    abi: OMNI_FACTORY_ABI,
    functionName: "estimateDeployFee",
    args: [
      params.tokenName,
      params.tokenSymbol,
      Number(params.decimal),
      valueToBigInt(params.totalSupplyBN),
      params.remoteConfigs.map((config) => ({
        _remoteChainId: config.remoteChainId,
        _receiver: config.receiver as Address,
        _remoteSupplyAmount: valueToBigInt(config.remoteSupplyAmount),
      })),
    ],
  });

  return params.remoteConfigs.map((config, index) => ({
    remoteChainId: config.remoteChainId,
    fee: nativeFees[index].toString(),
    feeFmt: normalize(nativeFees[index].toString(), 18),
  }));
}

export interface DeployOFTParams {
  tokenName: string;
  tokenSymbol: string;
  decimal: Number;
  totalSupplyBN: BigNumberValue;
  remoteConfigs: RemoteDeploymentConfig[];
  nativeFees: BigNumberValue[];
}

export interface EstimateDeployOFTParams {
  tokenName: string;
  tokenSymbol: string;
  decimal: Number;
  totalSupplyBN: BigNumberValue;
  remoteConfigs: RemoteDeploymentConfig[];
}

export interface RemoteDeploymentConfig {
  remoteChainId: number;
  receiver: string;
  remoteSupplyAmount: BigNumberValue;
}

export interface RemoteDeploymentFee {
  remoteChainId: number;
  fee: string;
  feeFmt: string;
}
