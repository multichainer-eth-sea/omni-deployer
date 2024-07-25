import { task } from 'hardhat/config';

task('get-gas-balance', 'Prints the gas balance of the account')
  .addParam('account', "The account's address")
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);
    console.log(ethers.formatEther(balance));
  });
