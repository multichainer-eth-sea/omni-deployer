import { expect } from 'chai';
import hre from 'hardhat';
import {
  prepareTestEnvironments,
  getEstimatedFees,
  getLocalCoinDeployedAddress,
  CoinDetails,
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
      const { nativeFees, totalNativeFees } = await getEstimatedFees(
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
      const { nativeFees, totalNativeFees } = await getEstimatedFees(
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

    it('should gossip back the deployment data to the entry point chain', async () => {
      // need to tidy up the test so it uses DRY principle
    });
  });
});
