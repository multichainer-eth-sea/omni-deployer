import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-verify';
import { config as envConfig } from './utils';

import './tasks';

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    arbitrumOne: {
      url: 'https://arbitrum.llamarpc.com',
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
    optimisticEthereum: {
      url: 'https://optimism.llamarpc.com',
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
    base: {
      url: 'https://mainnet.base.org',
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      arbitrumOne: envConfig.ARBITRUM_EXPLORER_API_KEY,
      optimisticEthereum: envConfig.OPTIMISM_EXPLORER_API_KEY,
      base: envConfig.BASE_EXPLORER_API_KEY,
    },
  },
};

export default config;
