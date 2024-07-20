import { HardhatUserConfig, vars } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

const ARB_ONE_PRIVATE_KEY = vars.get('ARB_ONE_PRIVATE_KEY') as string;
const ETHERSCAN_API_KEY = vars.get('ETHERSCAN_API_KEY') as string;

const config: HardhatUserConfig = {
  solidity: '0.8.24',
  networks: {
    arbitrum: {
      url: 'https://arbitrum.llamarpc.com',
      accounts: [ARB_ONE_PRIVATE_KEY],
    },
    optimism: {
      url: 'https://optimism.llamarpc.com',
      accounts: [ARB_ONE_PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
