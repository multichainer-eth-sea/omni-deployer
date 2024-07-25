import { scope } from 'hardhat/config';

const deployTask = scope('deploy');

deployTask
  .task('lz-v1', 'Deploys the MyLayerZeroV1 contract')
  .addParam(
    'lzEndpoint',
    'LayerZero Endpoint V1',
    '0x3c2269811836af69497E5F486A85D7316753cf62',
  )
  .setAction(async (taskArgs, hre) => {
    const MyLayerZeroV1 = await hre.ethers.getContractFactory('MyLayerZeroV1');
    const myLayerZeroV1 = await MyLayerZeroV1.deploy(taskArgs.lzEndpoint);
    await myLayerZeroV1.waitForDeployment();
    const deployedAddress = await myLayerZeroV1.getAddress();

    console.log(`MyLayerZeroV1 deployed at ${deployedAddress}`);

    await hre.run('verify:verify', {
      address: deployedAddress,
      constructorArguments: [taskArgs.lzEndpoint],
    });

    console.log(`MyLayerZeroV1 verified`);
  });
