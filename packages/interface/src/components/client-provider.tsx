"use client";
import { wagmiConfig } from "@/config/wagmi-config";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { type ThemeProviderProps } from "next-themes/dist/types";
import { WagmiProvider } from "wagmi";
import { AptosWalletProvider } from "./aptos-wallet/aptos-wallet-provider";

const queryClient = new QueryClient();

export function ClientProvider({ children }: React.PropsWithChildren) {
  return (
    <AptosWalletProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider>
            <ThemeProvider
              attribute="class"
              enableSystem
              disableTransitionOnChange
            >
              {children}
            </ThemeProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </AptosWalletProvider>
  );
}

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
