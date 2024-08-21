"use client";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumericalInput } from "@/components/ui/numerical-input";
import {
  deployOFT,
  RemoteDeploymentConfig,
  useSimulateDeployOFT,
} from "@/hooks/use-simulate-deploy-oft";
import {
  useEstimateVerifyOFT,
  useVerifyRemote,
} from "@/hooks/use-verify-remote";
import { OMNI_FACTORY_ABI } from "@/lib/abi/evm";
import { denormalize } from "@/lib/common/bignumber";
import {
  EVMChainId,
  LZ_TO_EVM_CHAIN_ID,
  lzChainMetadata,
} from "@/lib/network/chain-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { Terminal } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { decodeEventLog } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { useAccount, useClient, useSendTransaction } from "wagmi";
import { z } from "zod";
import { CheckerConnect } from "../checker-connect";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

const FormSchema = z.object({
  tokenName: z.string(),
  tokenSymbol: z.string(),
  decimal: z.string(),
  totalSupply: z.string(),
});

const _deploymentId = "";

export function CreateTokenForm() {
  const [deploymentId, setDeploymentId] = useState(_deploymentId);
  const [verifiedChains, setVerifiedChains] = useState(["", ""]);
  const { address } = useAccount();
  const client = useClient();
  const {
    data: hash,
    isPending: isDeployPending,
    sendTransaction: deployOFTTransaction,
  } = useSendTransaction();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tokenName: "OMNI EXAMPLE",
      tokenSymbol: "EXAMP",
      decimal: "18",
      totalSupply: "1000000",
    },
  });

  const defaultRemoteDeploymentConfigs: RemoteDeploymentConfig[] =
    useMemo(() => {
      if (!address) {
        return [];
      }

      return [
        {
          remoteChainId: 110,
          receiver: address,
          remoteSupplyAmount: denormalize(
            form.getValues("totalSupply"),
            Number(form.getValues("decimal")),
          ),
        },
        {
          remoteChainId: 111,
          receiver: address,
          remoteSupplyAmount: 0,
        },
      ];
    }, [address, form.getValues("totalSupply"), form.getValues("decimal")]);

  const { data: remoteDeploymentFee } = useSimulateDeployOFT(
    defaultRemoteDeploymentConfigs,
  );

  async function onSubmit(formData: z.infer<typeof FormSchema>) {
    const decimal = Number(formData.decimal);
    const totalSupplyBN = denormalize(formData.totalSupply, decimal);

    if (!address) {
      return;
    }

    if (!client) {
      return;
    }

    if (!remoteDeploymentFee) {
      return;
    }

    const txParams = deployOFT(EVMChainId.ARBITRUM, {
      tokenName: formData.tokenName,
      tokenSymbol: formData.tokenSymbol,
      decimal,
      totalSupplyBN,
      remoteConfigs: defaultRemoteDeploymentConfigs,
      nativeFees: remoteDeploymentFee.map((v) => v.fee),
    });

    deployOFTTransaction(
      {
        ...txParams,
      },
      {
        onSuccess: async (hash) => {
          console.log(hash);
          const receipt = await waitForTransactionReceipt(client, { hash });
          const [last] = receipt.logs.slice(-1);

          const parsed = decodeEventLog({
            abi: OMNI_FACTORY_ABI,
            data: last.data,
            topics: last.topics,
          });

          setDeploymentId(parsed.args.deploymentId);
        },
      },
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="flex w-full flex-wrap-reverse items-start justify-center gap-8 md:flex-wrap">
          <Card className="max-w-md flex-auto flex-col gap-8">
            <CardHeader>
              <CardTitle>Token Metadata</CardTitle>
              <CardDescription>
                Fill the form with your token metadata
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                onSubmit={form.handleSubmit(onSubmit)}
                className="w-full space-y-4"
              >
                <FormField
                  control={form.control}
                  name="tokenName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Omnicat" {...field} />
                      </FormControl>
                      <FormDescription>Name of the Token</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tokenSymbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Symbol</FormLabel>
                      <FormControl>
                        <Input placeholder="Omni" {...field} />
                      </FormControl>
                      <FormDescription>
                        Ticker symbol for the Token e.g $OMNI
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="decimal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Decimal</FormLabel>
                      <FormControl>
                        <NumericalInput
                          placeholder="18"
                          maxDecimal={0}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>Decimal for the token</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalSupply"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Supply</FormLabel>
                      <FormControl>
                        <NumericalInput
                          placeholder="1000000"
                          maxDecimal={0}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Total Supply of the Token
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
          <DeployProgress
            deploymentId={deploymentId}
            remoteDeploymentConfigs={defaultRemoteDeploymentConfigs}
            verifiedChains={verifiedChains}
            setVerifiedChains={setVerifiedChains}
            createTokenButton={
              hash ? (
                <Alert>
                  <Terminal className="h-4 w-4" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>
                    View your transaction{" "}
                    <a
                      className="underline"
                      target="_blank"
                      href={`https://arbiscan.io/tx/${hash}`}
                    >
                      here
                    </a>
                  </AlertDescription>
                </Alert>
              ) : (
                <CheckerConnect className="w-full">
                  <Button
                    loading={isDeployPending}
                    className="w-full"
                    type="submit"
                  >
                    {isDeployPending ? "Creating Token..." : "Create Token"}
                  </Button>
                </CheckerConnect>
              )
            }
          />
        </div>
      </form>
    </Form>
  );
}
function DeployProgress({
  deploymentId,
  remoteDeploymentConfigs,
  verifiedChains,
  setVerifiedChains,
  createTokenButton,
}: {
  deploymentId: string;
  remoteDeploymentConfigs: RemoteDeploymentConfig[];
  verifiedChains: string[];
  setVerifiedChains: (params: (value: string[]) => string[]) => void;
  createTokenButton?: React.ReactNode;
}) {
  const { isPending, verifyRemoteCoinDeployment } =
    useVerifyRemote(deploymentId);
  const {
    isRefetching,
    data: verifyNativeFees,
    refetch,
  } = useEstimateVerifyOFT(deploymentId, [110, 111]);

  return (
    <Card className="flex-grow-0 md:flex-grow-0">
      <CardHeader className="bg-muted/50">
        <CardTitle>Deploy Omni Token</CardTitle>
        <CardDescription>
          Follow steps bellow to create your omni token
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-2 border-b pb-2">
          <div className="flex items-center gap-2">
            <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
              <span>1</span>
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Create Token
            </h4>
          </div>
          <CardDescription>
            Ensure the token metadata you fill is correct
          </CardDescription>
          {createTokenButton}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
              <span>2</span>
            </div>
            <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
              Verify Token
            </h4>
          </div>
          <CardDescription>Verify Token on each network</CardDescription>
        </div>
        {remoteDeploymentConfigs.length > 0 &&
          remoteDeploymentConfigs.map((config, index) => (
            <div className="flex flex-col justify-between gap-2" key={index}>
              <div className="flex items-center gap-2">
                <img
                  src={lzChainMetadata[config.remoteChainId].imgUrl}
                  className="h-8 w-8"
                  alt="logo"
                />
                <p className="text-sm text-foreground/60">
                  {lzChainMetadata[config.remoteChainId].name}
                </p>
              </div>
              {verifiedChains[index] ? (
                <a
                  href={`${lzChainMetadata[config.remoteChainId].explorerUrl}/tx/${verifiedChains[index]}`}
                  className="text-sm text-foreground/60 underline"
                >
                  view transaction
                </a>
              ) : (
                <CheckerConnect
                  disabled={!deploymentId}
                  requiredChainId={LZ_TO_EVM_CHAIN_ID[config.remoteChainId]}
                >
                  <Button
                    loading={isPending || isRefetching}
                    disabled={!deploymentId}
                    onClick={async () => {
                      if (!verifyNativeFees) return;

                      await refetch();
                      verifyRemoteCoinDeployment(
                        [110, 111],
                        verifyNativeFees as bigint[],
                        (hash) => {
                          setVerifiedChains((prev: string[]) => {
                            const copy = [...prev];
                            copy[index] = hash;
                            return copy;
                          });
                        },
                      );
                    }}
                  >
                    Verify Token
                  </Button>
                </CheckerConnect>
              )}
            </div>
          ))}
      </CardContent>
    </Card>
  );
}
