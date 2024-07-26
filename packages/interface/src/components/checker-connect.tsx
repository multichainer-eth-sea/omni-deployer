import { useConnectModal } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import { Button, ButtonProps } from "./ui/button";

export function CheckerConnect({ children, ...buttonProps }: ButtonProps) {
  const { isConnected } = useAccount();
  const { openConnectModal } = useConnectModal();

  if (isConnected) {
    return children;
  }

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
