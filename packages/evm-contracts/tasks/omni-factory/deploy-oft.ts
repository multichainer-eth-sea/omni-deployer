import { scope } from 'hardhat/config';

import { CoinDetails } from '../../test/omnicoin/helper';
import { ethers } from 'ethers';

const deployedUas: Record<string, string> = {
  '110': '0x96832fd5F4B76A447099eE93575Bd8ba612ec9C4',
  '111': '0xcC95B595B098bFCa2a13582929A57166c5747e5B',
  '184': '0xA65fEC67cFcc50Fe40455Df3a570613EF9Fcb25A',
};

const coinDetails: CoinDetails = {
  name: 'Omni Pepe',
  symbol: 'POPO',
  decimals: '18',
  totalSupply: ethers.parseEther('1000').toString(),
  remoteConfigs: [
    {
      remoteChainId: 110,
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: ethers.parseEther('400').toString(),
    },
    {
      remoteChainId: 111,
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: ethers.parseEther('300').toString(),
    },
    {
      remoteChainId: 184,
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: ethers.parseEther('300').toString(),
    },
  ],
};

scope('omni-factory:exec')
  .task(
    'estimate-deploy-oft',
    'Estimate gas for deploying the OmniCoin Factory contract',
  )
  .addParam('chainId', 'Local Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const omniFactory = await hre.ethers.getContractAt(
      'OmniFactory',
      contractAddress,
    );

    const nativeFees = await omniFactory.estimateDeployFee(
      coinDetails.name,
      coinDetails.symbol,
      coinDetails.decimals,
      coinDetails.totalSupply,
      coinDetails.remoteConfigs.map((config) => ({
        _remoteChainId: config.remoteChainId,
        _receiver: config.receiver,
        _remoteSupplyAmount: config.remoteSupplyAmount,
      })),
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
  .task('deploy-oft', 'Deploys the OmniCoin contract')
  .addParam('chainId', 'Local Chain Id')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedUas[taskArgs.chainId.toString()];
    const omniFactory = await hre.ethers.getContractAt(
      'OmniFactory',
      contractAddress,
    );

    const nativeFees = await omniFactory.estimateDeployFee(
      coinDetails.name,
      coinDetails.symbol,
      coinDetails.decimals,
      coinDetails.totalSupply,
      coinDetails.remoteConfigs.map((config) => ({
        _remoteChainId: config.remoteChainId,
        _receiver: config.receiver,
        _remoteSupplyAmount: config.remoteSupplyAmount,
      })),
    );
    const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

    const tx = await omniFactory.deployRemoteCoin(
      coinDetails.name,
      coinDetails.symbol,
      coinDetails.decimals,
      coinDetails.totalSupply,
      coinDetails.remoteConfigs.map((config) => ({
        _remoteChainId: config.remoteChainId,
        _receiver: config.receiver,
        _remoteSupplyAmount: config.remoteSupplyAmount,
      })),
      nativeFees.map((fee) => fee.toString()),
      { value: totalNativeFees },
    );
    const receipt = await tx.wait();
    console.log('OFT deployed. https://layerzeroscan.com/tx/' +  receipt?.hash);
  });
