import * as dotenv from 'dotenv';

dotenv.config();

const ARBITRUM_PRIVATE_KEY = process.env.ARBITRUM_PRIVATE_KEY || '';
const APTOS_PRIVATE_KEY = process.env.APTOS_PRIVATE_KEY || '';
const SOLANA_PRIVATE_KEY = process.env.SOLANA_PRIVATE_KEY || '';

export const config = {
  ARBITRUM_PRIVATE_KEY,
  APTOS_PRIVATE_KEY,
  SOLANA_PRIVATE_KEY,
};
