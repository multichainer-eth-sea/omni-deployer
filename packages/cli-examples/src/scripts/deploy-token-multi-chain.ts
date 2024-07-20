import { CoinChain } from '@omni-deployer/sdk';
import { prepareSdk } from '../common';

const runDeployTokenMultiChain = async () => {
  const sdk = prepareSdk();
  const result = await sdk.coin.deployCoinMultiChain({
    coinName: '2-Multi-Chain-Coin',
    coinTicker: '2-TEST',
    coinTotalSupply: '1000000000000000000000000',
    coinDecimals: '18',
    chains: [
      {
        chain: CoinChain.ARBITRUM,
        amount: '500000000000000000000000',
        receiptAddress: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      },
      {
        chain: CoinChain.OPTIMISM,
        amount: '500000000000000000000000',
        receiptAddress: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      },
    ],
  });
  console.log('deploy result:', result);
};

export { runDeployTokenMultiChain };
