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

const FormSchema = z.object({
  inChainId: z.number(),
  outChainId: z.number(),
  tokenAddress: z.string(),
  amount: z.string(),
  senderAddress: z.string(),
  receiverAddress: z.string(),
});

export function BridgeTokenForm() {
  const { address } = useAccount();
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      tokenAddress: "0xB9b3991e80Db972237ee253536495158faB4dE88",
      inChainId: 110,
      outChainId: 111,
      amount: "100",
      senderAddress: address,
      receiverAddress: address,
    },
  });

  async function onSubmit(formData: z.infer<typeof FormSchema>) {}

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
