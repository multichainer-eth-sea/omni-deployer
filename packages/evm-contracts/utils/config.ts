import * as dotenv from 'dotenv';

dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || '';

export const config = {
  DEPLOYER_PRIVATE_KEY,
  ETHERSCAN_API_KEY,
};
