# Omni Deployer

## Prerequisites
-   Node.js v20+
-   pnpm v9+

```sh
# install pnpm if you haven't already
$ npm i -g pnpm
```

## Preparation

First install and build the SDK
```sh
$ pnpm install
$ pnpm build
```

Fill the .env in `cli-examples` package
```sh
$ cd packages/cli-examples
$ cp .env.example .env
$ vim .env
```

## Running the Example

Run the example
```sh
$ pnpm example get-gas-balances
```

Result
```
balances: {
  arbitrum: {
    chain: 'arbitrum',
    walletAddress: '0x976922801d71035C17967F2FEE7E137503aea6C0',
    balance: '0.000521552836779802',
    balanceUsd: '1.84',
    gasTicker: 'ETH'
  },
  optimism: {
    chain: 'optimism',
    walletAddress: '0x976922801d71035C17967F2FEE7E137503aea6C0',
    balance: '0.00232978856991481',
    balanceUsd: '8.21',
    gasTicker: 'ETH'
  },
  solana: {
    chain: 'solana',
    walletAddress: 'ADiHwcHY88NugpkgBJggS1ut8KMYfQY6f7CsUzQ66Qwg',
    balance: '2.316097592',
    balanceUsd: '394.48',
    gasTicker: 'SOL'
  },
  aptos: {
    chain: 'aptos',
    walletAddress: '0x159f6a5efbb404fb4a4bf8838491a649345857b86ab4f3bdfca4ff29148d661b',
    balance: '3.16523025',
    balanceUsd: '23.49',
    gasTicker: 'APT'
  }
}
```
