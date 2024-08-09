import { scope } from 'hardhat/config';
import { ethers } from 'ethers';
import { deployedUas } from './common';

const deploymentId =
  '0x29004138095413185A2006F3A09FF83C6D1FEACEA871B22325968689F6698D10';

scope('omni-factory:exec')
  .task(
    'estimate-verify-oft',
    'Estimate gas for verifying the OmniCoin Factory contract',
  )
  .addParam('chainId', 'Local Chain Id')
  .addParam('chainIdList', 'List of Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const omniFactory = await hre.ethers.getContractAt(
      'OmniFactory',
      contractAddress,
    );

    const nativeFees = await omniFactory.estimateVerifyFee(
      deploymentId,
      taskArgs.chainIdList.split(','),
    );
    const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

    console.log('Estimation (raw)');
    console.log({
      nativeFees: nativeFees.map((fee) => fee.toString()),
      totalNativeFees: totalNativeFees.toString(),
    });

    console.log('Estimation (formatted)');
    console.log({
      nativeFees: nativeFees.map((fee) => ethers.formatEther(fee)),
      totalNativeFees: ethers.formatEther(totalNativeFees),
    });
  });

scope('omni-factory:exec')
  .task('verify-oft', 'Verifies the OmniCoin contract')
  .addParam('chainId', 'Local Chain Id')
  .addParam('chainIdList', 'List of Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const omniFactory = await hre.ethers.getContractAt(
      'OmniFactory',
      contractAddress,
    );

    const nativeFees = await omniFactory.estimateVerifyFee(
      deploymentId,
      taskArgs.chainIdList.split(','),
    );
    const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

    const tx = await omniFactory.verifyRemoteCoinDeployment(
      deploymentId,
      taskArgs.chainIdList.split(','),
      nativeFees.map((fee) => fee.toString()),
      { value: totalNativeFees },
    );
    const receipt = await tx.wait();
    console.log('OFT verified. https://layerzeroscan.com/tx/' + receipt?.hash);
  });
