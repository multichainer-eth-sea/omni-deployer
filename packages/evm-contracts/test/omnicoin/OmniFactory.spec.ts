import { expect } from 'chai';
import hre from 'hardhat';
import {
  prepareTestEnvironments,
  getEstimatedDeployFees,
  getLocalCoinDeployedAddress,
  CoinDetails,
  getEstimatedVerifyFees,
} from './helper';

describe('OmniFactory', () => {
  describe('(deployment)', () => {
    it('should set the right layerzero endpoint', async () => {
      // ---------- arrange ---------- //
      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpoint = await LZEndpointMock.deploy(1);
      const lzEndpointAddress = await lzEndpoint.getAddress();

      // deploy the factory contract
      const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
      const factoryContract = await OmniFactory.deploy(lzEndpointAddress);

      // ---------- act ---------- //
      const actual = await factoryContract.lzEndpoint();

      // ---------- assert ---------- //
      expect(actual).to.equal(lzEndpointAddress);
    });
  });

  describe('deployLocalCoin()', () => {
    it('should deploy coin on local chain', async () => {
      // ---------- arrange ---------- //
      // prepare the owner
      const [owner] = await hre.ethers.getSigners();

      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpoint = await LZEndpointMock.deploy(1);
      const lzEndpointAddress = await lzEndpoint.getAddress();

      // deploy the factory contract
      const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
      const omniFactory = await OmniFactory.deploy(lzEndpointAddress);

      // prepare the coin details
      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
      };

      // ---------- act ---------- //
      // run deployLocalCoin()
      await (
        await omniFactory.deployLocalCoin(
          coinDetails.name,
          coinDetails.symbol,
          coinDetails.decimals,
          coinDetails.totalSupply,
        )
      ).wait();

      // retreive the coin address deployed
      const { coinDeployedAddress, receiverAddress, coinDeployed } =
        await getLocalCoinDeployedAddress(omniFactory);

      // ---------- assert ---------- //
      expect(coinDeployedAddress).to.not.be.empty;
      expect(receiverAddress).to.equal(owner.address);
      expect(await coinDeployed.name()).to.equal(coinDetails.name);
      expect(await coinDeployed.symbol()).to.equal(coinDetails.symbol);
      expect(await coinDeployed.decimals()).to.equal(coinDetails.decimals);
      expect(await coinDeployed.totalSupply()).to.equal(
        coinDetails.totalSupply,
      );
    });
  });

  describe('deployRemoteCoin()', () => {
    it('should deploy coin on other remote chains', async () => {
      // ---------- arrange ---------- //
      // prepare the test environment
      const { chainIds, omniFactoryAddresses, omniFactories } =
        await prepareTestEnvironments([69, 420, 1337]);

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
          remoteSupplyAmount: '250000000000000000000',
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
          remoteFactoryAddress: omniFactoryAddresses[rawConfig.chainIdIndex],
        })),
      };

      // get fees
      const { nativeFees, totalNativeFees } = await getEstimatedDeployFees(
        omniFactories[0],
        coinDetails,
      );

      // ---------- act ---------- //
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
            _remoteFactoryAddress: config.remoteFactoryAddress,
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

      // ---------- assert ---------- //
      const { deploymentId: deploymentIdMain } = localCoinDeployedData[0];
      for (let i = 0; i < localCoinDeployedData.length; i++) {
        const {
          deploymentId,
          coinDeployedAddress,
          receiverAddress,
          coinDeployed,
        } = localCoinDeployedData[i];

        const [name, symbol, decimals, totalSupply, deploymentIdCoin] =
          await Promise.all([
            coinDeployed.name(),
            coinDeployed.symbol(),
            coinDeployed.decimals(),
            coinDeployed.totalSupply(),
            coinDeployed.deploymentId(),
          ]);

        expect(coinDeployedAddress).to.not.be.empty;
        expect(receiverAddress).to.equal(owner.address);
        expect(name).to.equal(coinDetails.name);
        expect(symbol).to.equal(coinDetails.symbol);
        expect(decimals).to.equal(coinDetails.decimals);
        expect(totalSupply).to.equal(
          coinDetailsRemoteConfig[i].remoteSupplyAmount,
        );
        expect(deploymentIdCoin).to.equal(deploymentIdMain);
        expect(deploymentId).to.equal(deploymentIdMain);

        console.log({
          chainId: chainIds[coinDetailsRemoteConfig[i].chainIdIndex],
          coinDeployedAddress,
          totalSupplyActual: totalSupply,
          totalSupplyExpected: coinDetailsRemoteConfig[i].remoteSupplyAmount,
          deploymentId,
        });
      }
    });

    it('should deploy coin on this and others remote chains', async () => {
      // ---------- arrange ---------- //
      // prepare the test environment
      const { chainIds, omniFactoryAddresses, omniFactories } =
        await prepareTestEnvironments([69, 420, 1337]);

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
          remoteFactoryAddress: omniFactoryAddresses[rawConfig.chainIdIndex],
        })),
      };

      // get fees
      const { nativeFees, totalNativeFees } = await getEstimatedDeployFees(
        omniFactories[0],
        coinDetails,
      );

      // ---------- act ---------- //
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
            _remoteFactoryAddress: config.remoteFactoryAddress,
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

      // ---------- assert ---------- //
      for (let i = 0; i < localCoinDeployedData.length; i++) {
        const { coinDeployedAddress, receiverAddress, coinDeployed } =
          localCoinDeployedData[i];

        const [name, symbol, decimals, totalSupply] = await Promise.all([
          coinDeployed.name(),
          coinDeployed.symbol(),
          coinDeployed.decimals(),
          coinDeployed.totalSupply(),
        ]);

        expect(coinDeployedAddress).to.not.be.empty;
        expect(receiverAddress).to.equal(owner.address);
        expect(name).to.equal(coinDetails.name);
        expect(symbol).to.equal(coinDetails.symbol);
        expect(decimals).to.equal(coinDetails.decimals);
        expect(totalSupply).to.equal(
          coinDetailsRemoteConfig[i].remoteSupplyAmount,
        );

        console.log({
          chainId: chainIds[coinDetailsRemoteConfig[i].chainIdIndex],
          coinDeployedAddress,
          totalSupplyActual: totalSupply,
          totalSupplyExpected: coinDetailsRemoteConfig[i].remoteSupplyAmount,
        });
      }
    });
  });
  describe('verifyRemoteCoinDeployment()', () => {
    it('should verify the deployment of remote coin', async () => {
      // ---------- arrange ---------- //
      // prepare the test environment
      const { chainIds, omniFactoryAddresses, omniFactories } =
        await prepareTestEnvironments([69, 420, 1337]);

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
          remoteFactoryAddress: omniFactoryAddresses[rawConfig.chainIdIndex],
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
            _remoteFactoryAddress: config.remoteFactoryAddress,
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

      // ---------- act ---------- //
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

      // ---------- assert ---------- //
      console.log(coinDetails);
      console.log('deploying from chainId:', chainIds[0]);
      for (let i = 0; i < chainIds.length; i++) {
        console.log('====================================');
        for (let j = 0; j < coinDetailsRemoteConfig.length; j++) {
          const remoteChainIdIndex = coinDetailsRemoteConfig[j].chainIdIndex;
          const { coinDeployedAddress, chainId: coinDeployedChainId } =
            localCoinDeployedData[remoteChainIdIndex];
          const omniFactoryChainId = await omniFactories[i].getChainId();
          const coinAddressSavedBytes = await omniFactories[i].deployedCoins(
            deploymentId,
            coinDeployedChainId,
          );

          const abiCoder = new hre.ethers.AbiCoder();
          const [coinAddressSaved] = abiCoder.decode(
            ['address'],
            coinAddressSavedBytes,
          );

          console.log({
            omniFactoryChainId,
            coinDeployedChainId,
            coinDeployedAddress,
            coinAddressSavedBytes,
            coinAddressSaved,
          });

          expect(coinAddressSaved).to.equal(coinDeployedAddress);
        }
      }
    });
  });
});
