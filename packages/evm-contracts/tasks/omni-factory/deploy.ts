import { scope } from 'hardhat/config';
import { lzEndpoints } from './common';

scope('omni-factory:prepare')
  .task('deploy', 'Deploys the OmniCoin Factory contract')
  .addParam('chainId', 'Local Chain Id')
  .setAction(async (taskArgs, hre) => {
    const OmniFactoryStorage =
      await hre.ethers.getContractFactory('OmniFactoryStorage');
    const factoryStorageContract = await OmniFactoryStorage.deploy();
    await factoryStorageContract.waitForDeployment();
    const deployedStorageAddress = await factoryStorageContract.getAddress();

    const lzEndpoint = lzEndpoints[taskArgs.chainId.toString()];

    const OmniCoinFactory = await hre.ethers.getContractFactory('OmniFactory');
    const omniCoinFactory = await OmniCoinFactory.deploy(
      lzEndpoint,
      taskArgs.chainId.toString(),
      deployedStorageAddress,
    );
    await omniCoinFactory.waitForDeployment();
    const deployedFactoryAddress = await omniCoinFactory.getAddress();

    await hre.run('verify:verify', {
      address: deployedStorageAddress,
      constructorArguments: [],
    });

    await hre.run('verify:verify', {
      address: deployedFactoryAddress,
      constructorArguments: [
        lzEndpoint,
        taskArgs.chainId.toString(),
        deployedStorageAddress,
      ],
    });

    console.log(`OmniCoinFactory deployed at ${deployedFactoryAddress}`);
    console.log(`OmniFactoryStorage verified`);
    console.log(`OmniCoinFactory verified`);
  });
