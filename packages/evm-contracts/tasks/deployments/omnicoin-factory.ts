import { scope } from 'hardhat/config';

const deployTask = scope('deploy');

// arb / op :   0x3c2269811836af69497E5F486A85D7316753cf62
// base     :   0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7

// pnpm deploy:factory --network base
deployTask
  .task('omnicoin-factory', 'Deploys the OmniCoin Factory contract')
  .addParam(
    'lzEndpoint',
    'LayerZero Endpoint V1',
    '0x3c2269811836af69497E5F486A85D7316753cf62',
  )
  .setAction(async (taskArgs, hre) => {
    const OmniFactoryStorage =
      await hre.ethers.getContractFactory('OmniFactoryStorage');
    const factoryStorageContract = await OmniFactoryStorage.deploy();
    await factoryStorageContract.waitForDeployment();
    const deployedStorageAddress = await factoryStorageContract.getAddress();
    console.log(`OmniFactoryStorage deployed at ${deployedStorageAddress}`);

    const OmniCoinFactory = await hre.ethers.getContractFactory('OmniFactory');
    const omniCoinFactory = await OmniCoinFactory.deploy(
      taskArgs.lzEndpoint,
      deployedStorageAddress,
    );
    await omniCoinFactory.waitForDeployment();
    const deployedFactoryAddress = await omniCoinFactory.getAddress();
    console.log(`OmniCoinFactory deployed at ${deployedFactoryAddress}`);

    await hre.run('verify:verify', {
      address: deployedStorageAddress,
      constructorArguments: [],
    });
    console.log(`OmniFactoryStorage verified`);

    await hre.run('verify:verify', {
      address: deployedFactoryAddress,
      constructorArguments: [taskArgs.lzEndpoint, deployedStorageAddress],
    });
    console.log(`OmniCoinFactory verified`);
  });

// npx hardhat deploy omnicoin --name "OmniCoin" --symbol "OMC" --decimals 18 --total-supply 1000000000000000000000000000 --receiver "0x976922801d71035C17967F2FEE7E137503aea6C0" --network optimisticEthereum
