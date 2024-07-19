import * as dotenv from 'dotenv';

dotenv.config();

const ARBITRUM_PRIVATE_KEY = process.env.ARBITRUM_PRIVATE_KEY || '';

export const config = {
  ARBITRUM_PRIVATE_KEY,
};
