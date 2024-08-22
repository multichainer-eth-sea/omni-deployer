"use client";
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
import { denormalize, valueToBigInt } from "@/lib/common/bignumber";
import { LZ_TO_EVM_CHAIN_ID } from "@/lib/network/chain-id";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDebounce } from "use-debounce";
import { useAccount } from "wagmi";
import { z } from "zod";
import { CheckerAllowance } from "../checker-allowance";
import { CheckerConnect } from "../checker-connect";
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { NumericalInput } from "../ui/numerical-input";
import { useEstimateSend, useSendFrom } from "@/hooks/use-bridge";
import { useMemo } from "react";

const FormSchema = z.object({
  inChainId: z.number(),
  outChainId: z.number(),
  tokenAddress: z.string(),
  amount: z.string(),
});

export function BridgeTokenForm() {
  const { address } = useAccount();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tokenAddress: "0x07a4Ffd0b621372A7F433Bbfa5a9c27f8e7D3e82",
      inChainId: 110,
      outChainId: 111,
      amount: "1",
    },
  });

  const amountBI = useMemo(
    () => valueToBigInt(denormalize(form.getValues().amount, 18)),
    [form.getValues().amount],
  );

  const { data, error, refetch } = useEstimateSend({
    tokenAddress: form.getValues().tokenAddress,
    outChainId: form.getValues().outChainId,
    toAddress: address,
    amount: amountBI,
  });

  const { sendFrom, isPending } = useSendFrom({
    amount: amountBI,
    nativeFee: data?.nativeFee,
    outChainId: form.getValues().outChainId,
    toAddress: address,
    tokenAddress: form.getValues().tokenAddress,
  });

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  async function onSubmit(formData: z.infer<typeof FormSchema>) {
    await refetch();
    console.log("formData", formData);
    sendFrom();
  }

  return (
    <Form {...form}>
      <form
        className="flex justify-center"
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <Card className="max-w-md flex-auto flex-col gap-8">
          <CardHeader>
            <CardTitle>Bridge Token</CardTitle>
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
                name="tokenAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Token Addres</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Address of Token</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outChainId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Out Chain Id</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Destination Chain Id</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <NumericalInput maxDecimal={18} {...field} />
                    </FormControl>
                    <FormDescription>Amount of Token</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="text-sm font-medium leading-none">
                Fee: {data?.nativeFeeFmt}
              </p>
              <CheckerConnect
                className="w-full"
                requiredChainId={LZ_TO_EVM_CHAIN_ID[form.getValues().inChainId]}
              >
                <Button className="w-full" type="submit">
                  Bridge
                </Button>
              </CheckerConnect>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
