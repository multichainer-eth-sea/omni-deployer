import { AptosWalletSelector } from "@/components/aptos-wallet-selector";
import { useWallet } from "@aptos-labs/wallet-adapter-react";

export default function Home() {
  // Access fields / functions from the adapter
  const { account, connected, wallet, changeNetwork } = useWallet();
  return (
    <div className="container mx-auto mt-16 max-w-md">
      <div className="w-full flex-col gap-8">
        <h1 className="scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl">
          Aptos Page
        </h1>
        <AptosWalletSelector />
      </div>
    </div>
  );
}
