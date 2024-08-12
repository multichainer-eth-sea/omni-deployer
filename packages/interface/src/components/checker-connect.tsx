import { useChainModal, useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button, ButtonProps } from "./ui/button";

export interface CheckerConnectProps extends ButtonProps {
  requiredChainId?: number;
}

export function CheckerConnect({
  requiredChainId,
  children,
  ...buttonProps
}: CheckerConnectProps) {
  const { isConnected, chainId } = useAccount();
  const { openConnectModal } = useConnectModal();
  const { openChainModal } = useChainModal();

  const correctChainID =
    requiredChainId === undefined || chainId === requiredChainId;

  if (!isConnected) {
    const handleClick = (event: React.MouseEvent) => {
      event.preventDefault();
      openConnectModal && openConnectModal();
    };

    return (
      <Button onClick={handleClick} {...buttonProps}>
        Connect Wallet
      </Button>
    );
  }

  if (!correctChainID) {
    const handleClick = (event: React.MouseEvent) => {
      event.preventDefault();
      openChainModal && openChainModal();
    };

    return (
      <Button onClick={handleClick} {...buttonProps}>
        Change network
      </Button>
    );
  }

  return children;
}
