import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { arbitrum, optimism } from "viem/chains";

export const wagmiConfig = getDefaultConfig({
  appName: "omni-chain-deployer",
  projectId: "PROJECT-ID",
  chains: [arbitrum, optimism],
  ssr: true,
});
