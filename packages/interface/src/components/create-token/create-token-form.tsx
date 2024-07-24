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
import { toast } from "@/components/ui/use-toast";
import { denormalize, valueToBigInt } from "@/lib/common/bignumber";
import { zodResolver } from "@hookform/resolvers/zod";
import { Terminal } from "lucide-react";
import { useForm } from "react-hook-form";
import { encodeFunctionData, parseAbi } from "viem";
import { useSendTransaction } from "wagmi";
import { z } from "zod";
import { CheckerConnect } from "../checker-connect";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
const FormSchema = z.object({
  tokenName: z.string(),
  tokenSymbol: z.string(),
  decimal: z.string(),
  totalSupply: z.string(),
});

const factoryAddress = "0x3C790C7f9Ffa4c3290ED05Df5CfF39748b77dBf7";
const factoryInterface = [
  "function createOmniCoin( string _coinName, string _coinTicker, uint8 _coinDecimals, uint256 _coinTotalSupply) public",
] as const;
const factoryAbi = parseAbi(factoryInterface);

export function CreateTokenForm() {
  const { data: hash, isPending, sendTransaction } = useSendTransaction();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tokenName: "Omnidog",
      tokenSymbol: "OMNID",
      decimal: "18",
      totalSupply: "1000000",
    },
  });

  function onSubmit(formData: z.infer<typeof FormSchema>) {
    console.log("onsubmit call");
    const decimal = Number(formData.decimal);
    const totalSupplyBN = denormalize(formData.totalSupply, decimal);
    const data = encodeFunctionData({
      abi: factoryAbi,
      functionName: "createOmniCoin",
      args: [
        formData.tokenName,
        formData.tokenSymbol,
        decimal,
        valueToBigInt(totalSupplyBN),
      ],
    });

    sendTransaction({
      to: factoryAddress,
      data,
    });

    toast({
      title: "You submitted the following values:",
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white">
            {JSON.stringify(formData, null, 2)}
          </code>
        </pre>
      ),
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="my-4 w-full space-y-4"
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
                <NumericalInput placeholder="18" maxDecimal={0} {...field} />
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
              <FormDescription>Total Supply of the Token</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        {hash ? (
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
            <Button loading={isPending} className="w-full" type="submit">
              {isPending ? "Creating Token..." : "Create Token"}
            </Button>
          </CheckerConnect>
        )}
      </form>
    </Form>
  );
}
