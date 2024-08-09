import { scope } from 'hardhat/config';

scope('play')
  .task('byte-test-deploy', 'Deploys the BytePlayground contract')
  .setAction(async (_, hre) => {
    const ContractInit = await hre.ethers.getContractFactory('BytePlayground');
    const contract = await ContractInit.deploy();
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log(`ContractInit deployed at ${deployedAddress}`);

    await hre.run('verify:verify', {
      address: deployedAddress,
      constructorArguments: [],
    });

    console.log(`ContractInit verified`);
  });

// npx hardhat deploy omnicoin --name "OmniCoin" --symbol "OMC" --decimals 18 --total-supply 1000000000000000000000000000 --receiver "0x976922801d71035C17967F2FEE7E137503aea6C0" --network optimisticEthereum
