import { runGetGasBalance, runDeployTokenMultiChain } from './scripts';
import { Command } from 'commander';

const program = new Command();

program
  .name('cli-example')
  .description('CLI example for the Omni Deployer usage');

program
  .command('get-gas-balances')
  .description('Get the gas balances of all accounts')
  .action(runGetGasBalance);

program
  .command('deploy-omni-coin')
  .description('Deploy the OmniCoin contract')
  .action(runDeployTokenMultiChain);

program.parse();
