import { scope } from 'hardhat/config';

const deployedUas: Record<string, string> = {
  '110': '0x96832fd5F4B76A447099eE93575Bd8ba612ec9C4',
  '111': '0xcC95B595B098bFCa2a13582929A57166c5747e5B',
  '184': '0xA65fEC67cFcc50Fe40455Df3a570613EF9Fcb25A',
};

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

      // if (chainId !== taskArgs.chainId) {
      const tx = await omniFactory.setTrustedRemote(
        chainId,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [deployedUas[chainId], contractAddress],
        ),
      );
      await tx.wait();
      console.log(`Set trusted remote for ${taskArgs.chainId} to ${chainId}`);
      // }
    }
  });
