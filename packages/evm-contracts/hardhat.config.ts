import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import { config as envConfig } from './utils';

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    arbitrum: {
      url: 'https://arbitrum.llamarpc.com',
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
    optimism: {
      url: 'https://optimism.llamarpc.com',
      accounts: [envConfig.DEPLOYER_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: envConfig.ETHERSCAN_API_KEY,
  },
};

export default config;
