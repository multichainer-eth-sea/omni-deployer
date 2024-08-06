"use client";
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { PontemWallet } from "@pontem/wallet-adapter-plugin";
import { PropsWithChildren } from "react";
import { Network } from "@aptos-labs/ts-sdk";

export const AptosWalletProvider = ({ children }: PropsWithChildren) => {
  const wallets = [new PontemWallet()];

  return (
    <AptosWalletAdapterProvider
      plugins={wallets}
      autoConnect={true}
      dappConfig={{ network: Network.MAINNET }}
      onError={(error) => {
        console.log("error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
};
