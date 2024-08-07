import { scope } from 'hardhat/config';

// pnpm task:play gas-drop-deploy --chain-id 111 --network optimisticEthereum
// pnpm task:play gas-drop-deploy --chain-id 184 --network base
//
// https://optimistic.etherscan.io/address/0xB8BE1633a819B66A97770E6Fe65041FA7C9E3D6A
// https://basescan.org/address/0xe692398e30fD016c269a28BD7d826FD416c3e912
//
// pnpm task:play gas-drop-set-trusted-network --chain-id 111 --network optimisticEthereum
// pnpm task:play gas-drop-set-trusted-network --chain-id 184 --network base
//
// pnpm task:play send-ether-omnichain --ethers 0.000069 --src-chain-id 184 --dst-chain-id 111 --network base

const lzEndpoints: Record<string, string> = {
  '111': '0x3c2269811836af69497e5f486a85d7316753cf62',
  '184': '0xb6319cc6c8c27a8f5daf0dd3df91ea35c4720dd7',
};

scope('play')
  .task('gas-drop-deploy', 'Deploys the GasDrop contract')
  .addParam('chainId', 'Chain Id')
  .setAction(async (taskArgs, hre) => {
    const ContractInit = await hre.ethers.getContractFactory('GasDrop');

    const lzEndpoint = lzEndpoints[taskArgs.chainId.toString()];

    const contract = await ContractInit.deploy(lzEndpoint);
    await contract.waitForDeployment();
    const deployedAddress = await contract.getAddress();

    console.log(`GasDrop deployed at ${deployedAddress}`);

    await hre.run('verify:verify', {
      address: deployedAddress,
      constructorArguments: [lzEndpoint],
    });

    console.log(`GasDrop verified`);
  });

const deployedUas: Record<string, string> = {
  '111': '0x1f47f55A73A36f69C914Af86740cAD5b49627F41',
  '184': '0xc21d1713D53c5dF1cC4a0f0BD6bd6A62F09df0cE',
};

scope('play')
  .task('gas-drop-set-trusted-network', 'Sends ethers to the GasDrop contract')
  .addParam('chainId', 'Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const contract = await hre.ethers.getContractAt('GasDrop', contractAddress);
    for (let i = 0; i < Object.keys(deployedUas).length; i++) {
      const chainId = Object.keys(deployedUas)[i];

      if (chainId !== taskArgs.chainId) {
        const tx = await contract.setTrustedRemote(
          chainId,
          hre.ethers.solidityPacked(
            ['address', 'address'],
            [deployedUas[chainId], contractAddress],
          ),
        );

        const receipt = await tx.wait();
        console.log(`Trusted network set for ${chainId} -> ${receipt?.hash}`);
      }
    }
  });

const addressSent = '0x1f47f55A73A36f69C914Af86740cAD5b49627F41';
// pnpm task:play send-ether-omnichain --ethers 0.000069 --src-chain-id 184 --dst-chain-id 111 --network base
scope('play')
  .task('send-ether-omnichain', 'Sends ethers to the GasDrop contract')
  .addParam('ethers', 'Ethers to send')
  .addParam('srcChainId', 'Chain Id')
  .addParam('dstChainId', 'Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.srcChainId.toString()];
    const contract = await hre.ethers.getContractAt('GasDrop', contractAddress);

    const ethersSent = hre.ethers.parseEther(taskArgs.ethers);

    const totalEthersSent = await contract.estimateFeesWithTotalEthers(
      taskArgs.dstChainId,
      ethersSent,
      addressSent,
    );

    const tx = await contract.sendEtherOmnichain(
      taskArgs.dstChainId,
      ethersSent,
      addressSent,
      { value: totalEthersSent },
    );
    const receipt = await tx.wait();

    console.log(`Ethers sent to ${addressSent} on chain ${taskArgs.dstChainId}`);
    console.log(`Total ethers sent: ${hre.ethers.formatEther(totalEthersSent)}`);
    console.log(`https://layerzeroscan.com/tx/${receipt?.hash}`);
  });

// npx hardhat deploy omnicoin --name "OmniCoin" --symbol "OMC" --decimals 18 --total-supply 1000000000000000000000000000 --receiver "0x976922801d71035C17967F2FEE7E137503aea6C0" --network optimisticEthereum
