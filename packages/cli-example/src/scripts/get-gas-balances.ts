import { prepareSdk } from '../common';

const runGetGasBalance = async () => {
  const sdk = prepareSdk();
  const balances = await sdk.wallet.getGasBalances();
  console.log('balances:', balances);
};

export { runGetGasBalance };
