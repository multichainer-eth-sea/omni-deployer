import { runGetGasBalance } from './scripts/get-gas-balances';
import { Command } from 'commander';

const program = new Command();

program
  .name('cli-example')
  .description('CLI example for the Omni Deployer usage');

program
  .command('get-gas-balances')
  .description('Get the gas balances of all accounts')
  .action(runGetGasBalance);

program.parse();
