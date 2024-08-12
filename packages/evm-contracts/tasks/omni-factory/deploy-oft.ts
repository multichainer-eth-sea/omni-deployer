import { scope } from 'hardhat/config';
import { deployedUas } from './common';

type CoinDetailsRemoteConfig = {
  remoteChainId: string;
  receiver: string;
  remoteSupplyAmount: string;
};

type CoinDetails = {
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  remoteConfigs: CoinDetailsRemoteConfig[];
};

const coinDetails: CoinDetails = {
  name: 'Omni Pepe',
  symbol: 'POPO',
  decimals: '18',
  totalSupply: '1000000000000000000000',
  remoteConfigs: [
    {
      remoteChainId: '110',
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: '400000000000000000000',
    },
    {
      remoteChainId: '111',
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: '300000000000000000000',
    },
    {
      remoteChainId: '184',
      receiver: '0x976922801d71035C17967F2FEE7E137503aea6C0',
      remoteSupplyAmount: '300000000000000000000',
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

    console.log(coinDetails);

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
      nativeFees: nativeFees.map((fee) => hre.ethers.formatEther(fee)),
      totalNativeFees: hre.ethers.formatEther(totalNativeFees),
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
    console.log('OFT deployed. https://layerzeroscan.com/tx/' + receipt?.hash);
  });
