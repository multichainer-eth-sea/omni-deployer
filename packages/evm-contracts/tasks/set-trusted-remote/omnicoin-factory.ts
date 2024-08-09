import { scope } from 'hardhat/config';

// arb / op :   0x3c2269811836af69497E5F486A85D7316753cf62
// base     :   0xb6319cC6c8c27A8F5dAF0dD3DF91EA35C4720dd7

// pnpm set-trusted-remote:factory --chain-id 110 --network arbitrumOne
// pnpm set-trusted-remote:factory --chain-id 111 --network optimisticEthereum
// pnpm set-trusted-remote:factory --chain-id 184 --network base

const deployedUas: Record<string, string> = {
  '110': '0xBfBDFc58cCB7044D3c9828834b39982d9De4039B',
  '111': '0x9A06b0c69D87D9A38Ea29c2ecE8FB9940C9bEBd9',
  '184': '0x546403382F73704ac51ee2c92EbeFAbB3D3b7CF5',
};

scope('set-trusted-remote')
  .task('omnicoin-factory', 'Deploys the OmniCoin Factory contract')
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

