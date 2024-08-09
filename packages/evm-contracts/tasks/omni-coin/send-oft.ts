import { scope } from 'hardhat/config';
import { ethers } from 'ethers';

const deployedOFT: Record<string, string> = {
  '110': '0x0bd2ba5ed93acfb7250759800c4d31b3acaed454',
  '111': '0x6dec538d8a02c0f1a86043ddfaed8f4357e5eefd',
  '184': '0x9d874fb951F31586E283C21f7DBFB874f6636D25',
};

const sendToAmount: Record<string, string> = {
  '110': '1',
  '111': '2',
  '184': '3',
};

scope('omni-coin:exec')
  .task('estimate-send-oft', 'Estimate gas for sending OFT to remote chain')
  .addParam('chainId', 'Local Chain Id')
  .addParam('to', 'To Address')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedOFT[taskArgs.chainId.toString()];
    const omniCoin = await hre.ethers.getContractAt(
      'OmniCoin',
      contractAddress,
    );
    const abiCoder = new hre.ethers.AbiCoder();
    const toAddress = abiCoder.encode(['address'], [taskArgs.to]);
    const defaultAdapterParams = hre.ethers.solidityPacked(
      ['uint16', 'uint256'],
      [1, 200000],
    );
    const transferAmount = ethers.parseEther(sendToAmount[taskArgs.chainId]);

    // estimate nativeFees
    const { nativeFee } = await omniCoin.estimateSendFee(
      taskArgs.chainId,
      toAddress,
      transferAmount,
      false,
      defaultAdapterParams,
    );

    console.log('Estimation');
    console.log({
      nativeFee: nativeFee.toString(),
      nativeFeeFormatted: ethers.formatEther(nativeFee),
    });
  });

scope('omni-coin:exec')
  .task('send-oft', 'Send OFT to remote chain')
  .addParam('chainId', 'Local Chain Id')
  .addParam('from', 'From Address')
  .addParam('to', 'To Address')
  .setAction(async (taskArgs, hre) => {
    const contractAddress = deployedOFT[taskArgs.chainId.toString()];
    const omniCoin = await hre.ethers.getContractAt(
      'OmniCoin',
      contractAddress,
    );
    const abiCoder = new hre.ethers.AbiCoder();
    const toAddress = abiCoder.encode(['address'], [taskArgs.to]);
    const defaultAdapterParams = hre.ethers.solidityPacked(
      ['uint16', 'uint256'],
      [1, 200000],
    );
    const transferAmount = ethers.parseEther(sendToAmount[taskArgs.chainId]);

    // estimate nativeFees
    const { nativeFee } = await omniCoin.estimateSendFee(
      taskArgs.chainId,
      toAddress,
      transferAmount,
      false,
      defaultAdapterParams,
    );

    const tx = await omniCoin.sendFrom(
      taskArgs.from,
      taskArgs.chainId,
      toAddress,
      transferAmount,
      {
        refundAddress: taskArgs.from,
        zroPaymentAddress: hre.ethers.ZeroAddress,
        adapterParams: defaultAdapterParams,
      },
      { value: nativeFee },
    );

    const receipt = await tx.wait();
    console.log('OFT verified. https://layerzeroscan.com/tx/' + receipt?.hash);
  });
