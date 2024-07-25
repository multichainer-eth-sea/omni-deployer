import { scope } from 'hardhat/config';

const deployTask = scope('deploy');

deployTask
  .task('omnicoin-factory', 'Deploys the OmniCoin Factory contract')
  .setAction(async (_, hre) => {
    const OmniCoinFactory =
      await hre.ethers.getContractFactory('OmniCoinFactory');
    const omniCoinFactory = await OmniCoinFactory.deploy();
    await omniCoinFactory.waitForDeployment();
    const deployedAddress = await omniCoinFactory.getAddress();

    console.log(`OmniCoinFactory deployed at ${deployedAddress}`);

    await hre.run('verify:verify', {
      address: deployedAddress,
      constructorArguments: [],
    });

    console.log(`OmniCoinFactory verified`);
  });

// npx hardhat deploy omnicoin --name "OmniCoin" --symbol "OMC" --decimals 18 --total-supply 1000000000000000000000000000 --receiver "0x976922801d71035C17967F2FEE7E137503aea6C0" --network optimisticEthereum
