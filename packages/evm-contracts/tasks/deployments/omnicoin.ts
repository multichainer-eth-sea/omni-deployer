import { scope } from 'hardhat/config';

import {
  uniqueNamesGenerator,
  adjectives,
  colors,
  animals,
} from 'unique-names-generator';

function generateTokenName() {
  const name = uniqueNamesGenerator({
    separator: ' ',
    dictionaries: [adjectives, animals, colors], // colors can be omitted here as not used
    length: 2,
    style: 'capital',
  });
  const symbol = name.split(' ')[1].toUpperCase();

  return [name, symbol];
}

const [tokenName, tokenSymbol] = generateTokenName();

const deployTask = scope('deploy');

deployTask
  .task('omnicoin', 'Deploys the OmniCoin contract')
  .addParam('name', 'The name of the token', tokenName)
  .addParam('symbol', 'The symbol of the token', tokenSymbol)
  .addParam('decimals', 'The number of decimals of the token', '18')
  .addParam('totalSupply', 'The initial supply of the token', '420')
  .addParam(
    'receiver',
    'The address that will receive the initial supply',
    '0x976922801d71035c17967f2fee7e137503aea6c0',
  )
  .setAction(async (taskArgs, hre) => {
    const totalSupplyWei = hre.ethers.parseEther(taskArgs.totalSupply);
    const parameters = {
      name: taskArgs.name.toString(),
      symbol: taskArgs.symbol.toString(),
      decimals: taskArgs.decimals.toString(),
      totalSupply: totalSupplyWei.toString(),
      receiver: taskArgs.receiver.toString(),
    };

    const OmniCoin = await hre.ethers.getContractFactory('OmniCoin');
    const omniCoin = await OmniCoin.deploy(
      parameters.name,
      parameters.symbol,
      parameters.decimals,
      parameters.totalSupply,
      parameters.receiver,
    );
    await omniCoin.waitForDeployment();
    const deployedAddress = await omniCoin.getAddress();

    console.log(`OmniCoin deployed at ${deployedAddress}`);
    console.log(parameters);

    await hre.run('verify:verify', {
      address: deployedAddress,
      constructorArguments: Object.values(parameters),
    });

    console.log(`OmniCoin verified`);
  });

// npx hardhat deploy omnicoin --name "OmniCoin" --symbol "OMC" --decimals 18 --total-supply 1000000000000000000000000000 --receiver "0x976922801d71035C17967F2FEE7E137503aea6C0" --network optimisticEthereum
