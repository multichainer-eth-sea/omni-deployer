import * as dotenv from 'dotenv';

dotenv.config();

const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || '';
const ARBITRUM_EXPLORER_API_KEY = process.env.ARBITRUM_EXPLORER_API_KEY || '';
const OPTIMISM_EXPLORER_API_KEY = process.env.OPTIMISM_EXPLORER_API_KEY || '';
const BASE_EXPLORER_API_KEY = process.env.BASE_EXPLORER_API_KEY || '';

export const config = {
  DEPLOYER_PRIVATE_KEY,
  ARBITRUM_EXPLORER_API_KEY,
  OPTIMISM_EXPLORER_API_KEY,
  BASE_EXPLORER_API_KEY,
};
