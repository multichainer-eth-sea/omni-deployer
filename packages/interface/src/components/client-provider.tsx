"use client";
import { wagmiConfig } from "@/config/wagmi-config";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { AptosWalletProvider } from "./aptos-wallet-provider";

const queryClient = new QueryClient();

export function ClientProvider({ children }: React.PropsWithChildren) {
  return (
    <AptosWalletProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AptosWalletProvider>
  );
}
