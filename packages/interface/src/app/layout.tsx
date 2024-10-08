import { ClientProvider } from "@/components/client-provider";
import { cn } from "@/lib/utils";
import type { Metadata } from "next";
import { Inter as FontSans } from "next/font/google";
import "./globals.css";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { AppWrapper } from "@/components/app-wrapper";
import { Toaster } from "@/components/ui/toaster";

const fontSans = FontSans({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Omnichain Deployer",
  description: "Create Omnichain Token",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={cn(
          "min-h-screen bg-background bg-muted font-sans antialiased",
          fontSans.variable,
        )}
      >
        <ClientProvider>
          <AppWrapper>{children}</AppWrapper>
        </ClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
