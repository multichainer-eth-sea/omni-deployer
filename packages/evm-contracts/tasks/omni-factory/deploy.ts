import { scope } from 'hardhat/config';

const lzEndpoints: Record<string, string> = {
  '110': '0x3c2269811836af69497E5F486A85D7316753cf62',
  '111': '0x3c2269811836af69497E5F486A85D7316753cf62',
  '184': '0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7',
};

scope('omni-factory:prepare')
  .task('deploy', 'Deploys the OmniCoin Factory contract')
  .addParam('chainId', 'Local Chain Id')
  .setAction(async (taskArgs, hre) => {
    const OmniFactoryStorage =
      await hre.ethers.getContractFactory('OmniFactoryStorage');
    const factoryStorageContract = await OmniFactoryStorage.deploy();
    await factoryStorageContract.waitForDeployment();
    const deployedStorageAddress = await factoryStorageContract.getAddress();
    console.log(`OmniFactoryStorage deployed at ${deployedStorageAddress}`);

    const lzEndpoint = lzEndpoints[taskArgs.chainId.toString()];

    const OmniCoinFactory = await hre.ethers.getContractFactory('OmniFactory');
    const omniCoinFactory = await OmniCoinFactory.deploy(
      lzEndpoint,
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
      constructorArguments: [lzEndpoint, deployedStorageAddress],
    });
    console.log(`OmniCoinFactory verified`);
  });
