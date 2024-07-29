import { expect } from 'chai';
import hre from 'hardhat';
import { OmniFactory } from '../typechain-types';

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
      const factoryContract = await OmniFactory.deploy(lzEndpointAddress);

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
        await factoryContract.deployLocalCoin(
          coinDetails.name,
          coinDetails.symbol,
          coinDetails.decimals,
          coinDetails.totalSupply,
        )
      ).wait();

      // retreive the coin address deployed
      const [localCoinDeployedEvent] = await factoryContract.queryFilter(
        factoryContract.filters.LocalCoinDeployed(),
        'latest',
      );
      const [coinDeployedAddress, receiver] = localCoinDeployedEvent.args;

      // connect to coin deployed contract
      const coinDeployed = await hre.ethers.getContractAt(
        'OmniCoin',
        coinDeployedAddress,
      );

      // ---------- assert ---------- //
      expect(coinDeployedAddress).to.not.be.empty;
      expect(receiver).to.equal(owner.address);
      expect(await coinDeployed.name()).to.equal(coinDetails.name);
      expect(await coinDeployed.symbol()).to.equal(coinDetails.symbol);
      expect(await coinDeployed.decimals()).to.equal(coinDetails.decimals);
      expect(await coinDeployed.totalSupply()).to.equal(
        coinDetails.totalSupply,
      );
    });
  });
  describe('deployRemoteCoin()', () => {
    const getLocalCoinDeployedAddress = async (omniFactory: OmniFactory) => {
      const [localCoinDeployedEvent] = await omniFactory.queryFilter(
        omniFactory.filters.LocalCoinDeployed(),
        'latest',
      );
      const [coinDeployedAddress, receiverAddress] =
        localCoinDeployedEvent.args;
      const coinDeployed = await hre.ethers.getContractAt(
        'OmniCoin',
        coinDeployedAddress,
      );

      return { coinDeployed, coinDeployedAddress, receiverAddress };
    };

    it('should deploy coin on other remote chains', async () => {
      // ---------- arrange ---------- //
      // prepare the chain id
      const chainIds = [69, 420, 1337];

      // prepare the owner
      const [owner] = await hre.ethers.getSigners();

      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpoints = await Promise.all(
        chainIds.map(async (chainId) => await LZEndpointMock.deploy(chainId)),
      );
      const lzEndpointAddresses = await Promise.all(
        lzEndpoints.map(async (lzEndpoint) => await lzEndpoint.getAddress()),
      );

      // deploy the factory contract
      const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
      const omniFactories = await Promise.all(
        lzEndpointAddresses.map(
          async (lzEndpointAddress) =>
            await OmniFactory.deploy(lzEndpointAddress),
        ),
      );
      const omniFactoryAddresses = await Promise.all(
        omniFactories.map(
          async (omniFactory) => await omniFactory.getAddress(),
        ),
      );

      // set lzmock endpoint address
      for (let i = 0; i < chainIds.length; i++) {
        for (let j = 0; j < chainIds.length; j++) {
          if (i !== j) {
            await lzEndpoints[i].setDestLzEndpoint(
              omniFactoryAddresses[j],
              lzEndpointAddresses[j],
            );
          }
        }
      }

      // set trusted network
      for (let i = 0; i < chainIds.length; i++) {
        for (let j = 0; j < chainIds.length; j++) {
          if (i !== j) {
            await omniFactories[i].setTrustedRemote(
              chainIds[j],
              hre.ethers.solidityPacked(
                ['address', 'address'],
                [omniFactoryAddresses[j], omniFactoryAddresses[i]],
              ),
            );
          }
        }
      }

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
      const coinDetails = {
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

      // ---------- act ---------- //
      // get fees
      const nativeFees = await omniFactories[0].estimateFee(
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
      );
      const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

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
    it('[old] should deploy coin on other remote chains', async () => {
      // ---------- arrange ---------- //
      // prepare the chain id
      const [CHAIN_A, CHAIN_B, CHAIN_C] = [69, 420, 777];

      // prepare the owner
      const [owner] = await hre.ethers.getSigners();

      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpointA = await LZEndpointMock.deploy(CHAIN_A);
      const lzEndpointB = await LZEndpointMock.deploy(CHAIN_B);
      const lzEndpointC = await LZEndpointMock.deploy(CHAIN_C);
      const lzEndpointAddressA = await lzEndpointA.getAddress();
      const lzEndpointAddressB = await lzEndpointB.getAddress();
      const lzEndpointAddressC = await lzEndpointC.getAddress();

      // deploy the factory contract
      const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
      const factoryContractA = await OmniFactory.deploy(lzEndpointAddressA);
      const factoryContractB = await OmniFactory.deploy(lzEndpointAddressB);
      const factoryContractC = await OmniFactory.deploy(lzEndpointAddressC);
      const factoryContractAddressA = await factoryContractA.getAddress();
      const factoryContractAddressB = await factoryContractB.getAddress();
      const factoryContractAddressC = await factoryContractC.getAddress();

      // set lzmock endpoint address
      await lzEndpointA.setDestLzEndpoint(
        factoryContractAddressB,
        lzEndpointAddressB,
      );
      await lzEndpointA.setDestLzEndpoint(
        factoryContractAddressC,
        lzEndpointAddressC,
      );
      await lzEndpointB.setDestLzEndpoint(
        factoryContractAddressA,
        lzEndpointAddressA,
      );
      await lzEndpointC.setDestLzEndpoint(
        factoryContractAddressA,
        lzEndpointAddressA,
      );

      // set trusted network
      await factoryContractA.setTrustedRemote(
        CHAIN_B,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressB, factoryContractAddressA],
        ),
      );
      await factoryContractA.setTrustedRemote(
        CHAIN_C,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressC, factoryContractAddressA],
        ),
      );
      await factoryContractB.setTrustedRemote(
        CHAIN_A,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressA, factoryContractAddressB],
        ),
      );
      await factoryContractC.setTrustedRemote(
        CHAIN_A,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressA, factoryContractAddressC],
        ),
      );

      // prepare the coin details
      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
        remoteConfigs: [
          {
            remoteChainId: CHAIN_B,
            receiver: owner.address,
            remoteSupplyAmount: '750000000000000000000',
            remoteFactoryAddress: factoryContractAddressB,
          },
          {
            remoteChainId: CHAIN_C,
            receiver: owner.address,
            remoteSupplyAmount: '250000000000000000000',
            remoteFactoryAddress: factoryContractAddressC,
          },
        ],
      };

      // ---------- act ---------- //
      // get fees
      const nativeFees = await factoryContractA.estimateFee(
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
      );
      const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

      // run deployRemoteCoin()
      await (
        await factoryContractA.deployRemoteCoin(
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
      const [localCoinDeployedEventB] = await factoryContractB.queryFilter(
        factoryContractB.filters.LocalCoinDeployed(),
        'latest',
      );
      const [coinDeployedAddressB, receiverB] = localCoinDeployedEventB.args;

      const [localCoinDeployedEventC] = await factoryContractC.queryFilter(
        factoryContractC.filters.LocalCoinDeployed(),
        'latest',
      );
      const [coinDeployedAddressC, receiverC] = localCoinDeployedEventC.args;

      // connect to coin deployed contract
      const coinDeployedB = await hre.ethers.getContractAt(
        'OmniCoin',
        coinDeployedAddressB,
      );
      const coinDeployedC = await hre.ethers.getContractAt(
        'OmniCoin',
        coinDeployedAddressC,
      );

      // ---------- assert ---------- //
      expect(coinDeployedAddressB).to.not.be.empty;
      expect(receiverB).to.equal(owner.address);
      expect(await coinDeployedB.name()).to.equal(coinDetails.name);
      expect(await coinDeployedB.symbol()).to.equal(coinDetails.symbol);
      expect(await coinDeployedB.decimals()).to.equal(coinDetails.decimals);
      expect(await coinDeployedB.totalSupply()).to.equal(
        '750000000000000000000',
      );
      expect(coinDeployedAddressC).to.not.be.empty;
      expect(receiverC).to.equal(owner.address);
      expect(await coinDeployedC.name()).to.equal(coinDetails.name);
      expect(await coinDeployedC.symbol()).to.equal(coinDetails.symbol);
      expect(await coinDeployedC.decimals()).to.equal(coinDetails.decimals);
      expect(await coinDeployedC.totalSupply()).to.equal(
        '250000000000000000000',
      );
    });

    it('should deploy coin on this and others remote chains', async () => {
      // need to tidy up the test so it uses DRY principle
    });

    it('should gossip back the deployment data to the entry point chain', async () => {
      // need to tidy up the test so it uses DRY principle
    });
  });
});
