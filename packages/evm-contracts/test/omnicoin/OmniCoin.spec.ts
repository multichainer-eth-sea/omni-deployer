import { expect } from 'chai';
import hre from 'hardhat';
import {
  prepareTestEnvironments,
  getEstimatedDeployFees,
  getLocalCoinDeployedAddress,
  CoinDetails,
  getEstimatedVerifyFees,
  getOmniCoinTransferEvents,
} from './helper';

describe('OmniCoin', () => {
  describe('verifyRemoteCoinDeployment()', () => {
    it('should able to transfer omnichain', async () => {
      // ---------- arrange ---------- //
      // prepare the test environment
      const {
        chainIds,
        omniFactoryAddresses,
        omniFactories,
        lzEndpoints,
        lzEndpointAddresses,
      } = await prepareTestEnvironments([69, 420, 1337]);

      // prepare the owner
      const [owner] = await hre.ethers.getSigners();

      // prepare the coin details
      const coinDetailsRemoteConfig = [
        {
          chainIdIndex: 1,
          receiverAddress: owner.address,
          remoteSupplyAmount: '750000000000000000000',
        },
        {
          chainIdIndex: 2,
          receiverAddress: owner.address,
          remoteSupplyAmount: '150000000000000000000',
        },
        {
          chainIdIndex: 0,
          receiverAddress: owner.address,
          remoteSupplyAmount: '100000000000000000000',
        },
      ];

      const coinDetails: CoinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
        remoteConfigs: coinDetailsRemoteConfig.map((rawConfig) => ({
          remoteChainId: chainIds[rawConfig.chainIdIndex],
          receiver: rawConfig.receiverAddress,
          remoteSupplyAmount: rawConfig.remoteSupplyAmount,
        })),
      };

      // get fees
      const { nativeFees, totalNativeFees } = await getEstimatedDeployFees(
        omniFactories[0],
        coinDetails,
      );

      // run deployRemoteCoin()
      await (
        await omniFactories[0].deployRemoteCoin(
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
        )
      ).wait();

      // retreive the coin address deployed
      const localCoinDeployedData = await Promise.all(
        coinDetailsRemoteConfig.map(
          async (config) =>
            await getLocalCoinDeployedAddress(
              omniFactories[config.chainIdIndex],
            ),
        ),
      );

      const deploymentId = localCoinDeployedData[0].deploymentId;

      for (let i = 0; i < localCoinDeployedData.length; i++) {
        const { nativeFees, totalNativeFees } = await getEstimatedVerifyFees(
          omniFactories[i],
          deploymentId,
          chainIds,
        );

        // run verifyRemoteCoinDeployment()
        const tx = await omniFactories[i].verifyRemoteCoinDeployment(
          deploymentId,
          chainIds,
          nativeFees.map((fee) => fee.toString()),
          { value: totalNativeFees },
        );
        await tx.wait();
      }

      // set mindstgaslimit
      // await localOFT.setMinDstGas(remoteChainId, 0, 200000)
      // await localOFT.setMinDstGas(remoteChainId, 1, 200000)

      // setDestLzEndpoint
      for (let i = 0; i < localCoinDeployedData.length; i++) {
        for (let j = 0; j < localCoinDeployedData.length; j++) {
          // set lzmock endpoint address
          const chainIdADeployedIndex = coinDetailsRemoteConfig[i].chainIdIndex;
          const chainIdBDeployedIndex = coinDetailsRemoteConfig[j].chainIdIndex;

          const { coinDeployedAddress: coinDeployedAddressB } =
            localCoinDeployedData[j];

          await lzEndpoints[chainIdADeployedIndex].setDestLzEndpoint(
            coinDeployedAddressB,
            lzEndpointAddresses[chainIdBDeployedIndex],
          );
        }
      }

      // ---------- act ---------- //
      for (let i = 0; i < localCoinDeployedData.length; i++) {
        for (let j = 0; j < localCoinDeployedData.length; j++) {
          if (i === j) continue;

          const {
            coinDeployed: coinDeployedA,
            coinDeployedAddress: coinDeployedAddressA,
            chainId: chainIdA,
          } = localCoinDeployedData[i];
          const ownerBalanceBeforeA = await coinDeployedA.balanceOf(
            owner.address,
          );
          const transferAmount = hre.ethers.parseEther('1');

          const {
            coinDeployed: coinDeployedB,
            coinDeployedAddress: coinDeployedAddressB,
            chainId: chainIdB,
          } = localCoinDeployedData[j];

          const ownerBalanceBeforeB = await coinDeployedB.balanceOf(
            owner.address,
          );

          const abiCoder = new hre.ethers.AbiCoder();
          const destinationAddress = abiCoder.encode(
            ['address'],
            [owner.address],
          );
          const defaultAdapterParams = hre.ethers.solidityPacked(
            ['uint16', 'uint256'],
            [1, 200000],
          );

          // estimate nativeFees
          const { nativeFee } = await coinDeployedA.estimateSendFee(
            chainIdB,
            destinationAddress,
            transferAmount,
            false,
            defaultAdapterParams,
          );

          // transfer from coinDeployedA to coinDeployedB
          await coinDeployedA.sendFrom(
            owner.address,
            chainIdB,
            destinationAddress,
            transferAmount,
            {
              refundAddress: owner.address,
              zroPaymentAddress: hre.ethers.ZeroAddress,
              adapterParams: defaultAdapterParams,
            },
            { value: nativeFee },
          );

          const ownerBalanceAfterA = await coinDeployedA.balanceOf(
            owner.address,
          );
          const ownerBalanceAfterB = await coinDeployedB.balanceOf(
            owner.address,
          );

          console.log({
            chainIdA,
            chainIdB,
            coinDeployedA: coinDeployedAddressA,
            coinDeployedB: coinDeployedAddressB,
            ownerBalanceBeforeA: ownerBalanceBeforeA.toString(),
            ownerBalanceBeforeB: ownerBalanceBeforeB.toString(),
            transferAmount: transferAmount.toString(),
            ownerBalanceAfterA: ownerBalanceAfterA.toString(),
            ownerBalanceAfterB: ownerBalanceAfterB.toString(),
          });
          console.log(
            'coinDeployedA transfers:',
            await getOmniCoinTransferEvents(coinDeployedA),
          );
          console.log(
            'coinDeployedB transfers:',
            await getOmniCoinTransferEvents(coinDeployedB),
          );
          console.log('=======================');

          expect(await coinDeployedA.balanceOf(owner.address)).to.be.eq(
            ownerBalanceBeforeA - transferAmount,
          );
          expect(await coinDeployedB.balanceOf(owner.address)).to.be.eq(
            ownerBalanceBeforeB + transferAmount,
          );
        }
      }
    });
  });
});
