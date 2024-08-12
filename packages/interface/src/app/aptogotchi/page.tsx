"use client";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { aptogocthi_abi } from "@/lib/abi/aptogotchi";
import { getAptosClient } from "@/lib/aptos/client";
import { useWallet } from "@aptos-labs/wallet-adapter-react";
import { useMutation, useQuery } from "@tanstack/react-query";

const aptosClient = getAptosClient();

export default function Home() {
  // Access fields / functions from the adapter
  return (
    <div className="container mx-auto mt-16 max-w-md">
      <div className="flex w-full flex-col gap-8">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Aptogotchi
        </h1>
        <AptogotchiInfo />
      </div>
    </div>
  );
}

export function AptogotchiInfo() {
  const { account } = useWallet();
  const { data, isLoading, error } = useGetAptogotchi(account?.address);
  const { isPending, mutate } = usePlayAptogotchi();

  return (
    <div className="flex flex-col gap-4">
      <div>
        {isLoading ? (
          <p>Loading...</p>
        ) : error ? (
          <p>Error: {error.message}</p>
        ) : data ? (
          <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(data, null, 2)}</code>
          </pre>
        ) : (
          <p>No data</p>
        )}
      </div>
      <div className="flex">
        <Button
          className="w-full"
          disabled={isPending}
          onClick={() => mutate()}
        >
          {isPending ? "Playing..." : "Play"}
        </Button>
      </div>
    </div>
  );
}

export function useGetAptogotchi(userAddress?: string) {
  return useQuery({
    queryKey: ["getAptogotchi", userAddress],
    queryFn: async () => {
      const data = await aptosClient.view<
        [string, string, string, { body: string; ear: string; face: string }]
      >({
        payload: {
          function: `${aptogocthi_abi.address}::${aptogocthi_abi.name}::get_aptogotchi`,
          functionArguments: [userAddress],
        },
      });

      return {
        name: data[0],
        birthday: data[1],
        energy: data[2],
        parts: data[3],
      };
    },
    enabled: !!userAddress,
  });
}

export function usePlayAptogotchi() {
  const ENERGY_COST = 1;
  const { account, signAndSubmitTransaction } = useWallet();
  const { refetch } = useGetAptogotchi(account?.address);

  async function play() {
    if (!account) return;
    const response = await signAndSubmitTransaction({
      sender: account.address,
      data: {
        function: `${aptogocthi_abi.address}::main::play`,
        typeArguments: [],
        functionArguments: [ENERGY_COST],
      },
    });

    await aptosClient.waitForTransaction({
      transactionHash: response.hash,
    });
  }

  return useMutation({
    mutationFn: play,
    onSuccess: () => {
      console.log("Played successfully");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Error playing Aptogotchi",
        variant: "destructive",
      });
    },
  });
}
