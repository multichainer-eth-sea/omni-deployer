import { scope } from 'hardhat/config';
import { deployedUas } from './common';

scope('omni-factory:prepare')
  .task('set-trusted-remote', 'Set Trusted Remote for OmniCoin Factory')
  .addParam('chainId', 'Local Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const omniFactory = await hre.ethers.getContractAt(
      'OmniFactory',
      contractAddress,
    );

    for (let i = 0; i < Object.keys(deployedUas).length; i++) {
      const chainId = Object.keys(deployedUas)[i];

      if (chainId !== taskArgs.chainId) {
        const tx = await omniFactory.setTrustedRemote(
          chainId,
          hre.ethers.solidityPacked(
            ['address', 'address'],
            [deployedUas[chainId], contractAddress],
          ),
        );
        await tx.wait();
        console.log(`Set trusted remote for ${taskArgs.chainId} to ${chainId}`);
      }
    }
  });
