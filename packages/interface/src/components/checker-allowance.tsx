import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount, useClient, useSendTransaction } from "wagmi";
import { Button, ButtonProps } from "./ui/button";
import { useQuery } from "@tanstack/react-query";
import { readContract } from "viem/actions";
import { Address, encodeFunctionData, erc20Abi } from "viem";
import { valueToBigInt } from "@/lib/common/bignumber";
import { useToast } from "./ui/use-toast";

export interface CheckerAllowanceProp extends ButtonProps {
  tokenAddress?: string;
  spenderAddress?: string;
  requiredAllowance?: bigint;
}

export function CheckerAllowance({
  tokenAddress,
  spenderAddress,
  children,
  requiredAllowance = valueToBigInt(0),
  ...buttonProps
}: CheckerAllowanceProp) {
  const { address: owner } = useAccount();
  const { toast } = useToast();
  const client = useClient();

  const { data, refetch } = useQuery({
    queryKey: [
      "checkerAllowance",
      tokenAddress,
      owner,
      spenderAddress,
    ] as const,
    queryFn: async () => {
      if (!tokenAddress) return;
      if (!owner) return;
      if (!spenderAddress) return;
      if (!client) return;

      const allowance = await readContract(client, {
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: "allowance",
        args: [owner, spenderAddress as Address],
      });

      return allowance;
    },
    enabled: !!tokenAddress && !!owner && !!spenderAddress && !!client,
  });

  const { sendTransaction, isPending } = useSendTransaction({
    mutation: {
      onSuccess: () => {
        refetch();
        toast({
          title: "Success",
          description: "Successfully approved allowance",
        });
      },
    },
  });

  if (data != undefined) {
    if (data < requiredAllowance) {
      return (
        <Button
          loading={isPending}
          onClick={() => {
            sendTransaction({
              to: tokenAddress as Address,
              data: encodeFunctionData({
                abi: erc20Abi,
                functionName: "approve",
                args: [spenderAddress as Address, requiredAllowance],
              }),
            });
          }}
          {...buttonProps}
        >
          Approve Token
        </Button>
      );
    }
  }

  return children;
}
