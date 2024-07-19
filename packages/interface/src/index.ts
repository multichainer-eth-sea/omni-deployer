import {
  AptClientAdapter,
  ClientMap,
  CoinChain,
  EvmClientAdapter,
  Sdk,
  SolClientAdapter,
} from '@omni-deployer/sdk';

function prepareSdk() {
  const clientMap: ClientMap = {
    [CoinChain.ARBITRUM]: new EvmClientAdapter(),
    [CoinChain.OPTIMISM]: new EvmClientAdapter(),
    [CoinChain.SOLANA]: new SolClientAdapter(),
    [CoinChain.APTOS]: new AptClientAdapter(),
  };

  const sdk = new Sdk({
    clientMap,
  });

  return sdk;
}

async function main() {
  const sdk = prepareSdk();
  const balances = await sdk.wallet.getGasBalances();
  console.log('balances:', balances);
}

main();
