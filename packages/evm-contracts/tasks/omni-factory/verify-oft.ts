import { scope } from 'hardhat/config';
import { ethers } from 'ethers';

const deployedUas: Record<string, string> = {
  '110': '0x96832fd5F4B76A447099eE93575Bd8ba612ec9C4',
  '111': '0xcC95B595B098bFCa2a13582929A57166c5747e5B',
  '184': '0xA65fEC67cFcc50Fe40455Df3a570613EF9Fcb25A',
};

const deploymentId =
  '0xE1BEF6A67A00734328693EBB37FCCEECE6980EB88BAB7A6E21101EE463AADF7A';

scope('omni-factory:exec')
  .task(
    'estimate-verify-oft',
    'Estimate gas for verifying the OmniCoin Factory contract',
  )
  .addParam('chainId', 'Local Chain Id')
  .addParam('chainIdList', 'Deployed Chain Ids')
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
  .task('verify-oft', 'Verify the OmniCoin contract')
  .addParam('chainId', 'Local Chain Id')
  .addParam('chainIdList', 'Deployed Chain Ids')
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
