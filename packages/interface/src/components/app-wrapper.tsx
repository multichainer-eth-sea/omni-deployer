"use client";

import { MoonIcon, SunIcon } from "@radix-ui/react-icons";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useTheme } from "next-themes";
import Image from "next/image";
import { usePathname } from "next/navigation";
import * as React from "react";
import { AptosWalletSelector } from "./aptos-wallet/aptos-wallet-selector";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const links = [
  {
    href: "/",
    label: "Create",
  },
  {
    href: "/bridge",
    label: "Bridge",
  },
];

export function AppWrapper({ children }: React.PropsWithChildren) {
  const pathname = usePathname();

  return (
    <div className="relative flex min-h-screen flex-col bg-muted/40">
      <header className="sticky top-0 z-50 w-full border-border/40 bg-background/95 shadow backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
          <div className="flex items-center">
            <div className="mr-4 flex items-center gap-2">
              <a className="text-sm font-bold" href="/">
                <Image src="/logo.svg" alt="ETH SEA" width={30} height={30} />
              </a>
              <span className="font-bold lg:inline-block">Omnichain</span>
            </div>
            <nav className="flex gap-4 text-sm">
              {links.map(({ href, label }) => (
                <a
                  key={href}
                  className={`${pathname == href ? "text-foreground/80" : "text-foreground/60"} transition-colors hover:text-foreground/80`}
                  href={href}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {/* <AptosWalletSelector /> */}
            <ConnectButton showBalance={false} />
            {/* <ModeToggle /> */}
          </div>
        </div>
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border bg-background py-6 md:px-8 md:py-0">
        <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
          <p className="text-balance text-center text-sm leading-loose text-muted-foreground md:text-left">
            Built for{" "}
            <a
              href="https://x.com/ethereum_sea"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              ETH SEA
            </a>
            . The source code is available on{" "}
            <a
              href="https://github.com/multichainer-eth-sea"
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </footer>
    </div>
  );
}

export function ModeToggle() {
  const { setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <SunIcon className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <MoonIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
