import { expect } from 'chai';
import hre from 'hardhat';

describe('OmniCoinFactoryV2', function () {
  describe('(deployment)', function () {
    it('should set the right layerzero endpoint', async function () {
      // arrange
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpointMockLocal = await LZEndpointMock.deploy(420);
      const expected = await lzEndpointMockLocal.getAddress();

      const OmniFactoryV2 =
        await hre.ethers.getContractFactory('OmniCoinFactoryV2');
      const omniFactoryV2 = await OmniFactoryV2.deploy(expected);

      // act
      const actual = await omniFactoryV2.getLzEndpointAddress();

      // assert
      expect(actual).to.equal(expected);
    });
  });

  describe('deployLocalCoin()', function () {
    it('deploys coin on current chain', async function () {
      // arrange
      const [owner] = await hre.ethers.getSigners();

      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpointMockLocal = await LZEndpointMock.deploy(420);

      const OmniFactoryV2 =
        await hre.ethers.getContractFactory('OmniCoinFactoryV2');
      const omniFactoryV2 = await OmniFactoryV2.deploy(
        await lzEndpointMockLocal.getAddress(),
      );

      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
      };

      // act
      const tx = await omniFactoryV2.deployLocalCoin(
        coinDetails.name,
        coinDetails.symbol,
        coinDetails.decimals,
        coinDetails.totalSupply,
      );
      await tx.wait();

      const [eventLocalCoinDeployed] = await omniFactoryV2.queryFilter(
        omniFactoryV2.filters.LocalCoinDeployed(),
        'latest',
      );
      const [deployedCoinAddress, creator] = eventLocalCoinDeployed.args;

      const coin = await hre.ethers.getContractAt(
        'OmniCoinV2',
        deployedCoinAddress,
      );

      // assert
      expect(deployedCoinAddress).to.not.be.empty;
      expect(creator).to.equal(owner.address);
      expect(await coin.name()).to.equal(coinDetails.name);
      expect(await coin.symbol()).to.equal(coinDetails.symbol);
      expect(await coin.decimals()).to.equal(coinDetails.decimals);
      expect(await coin.totalSupply()).to.equal(coinDetails.totalSupply);
    });
  });

  describe('deployRemoteCoin()', function () {
    it('gives order to deploy on remote chain', async function () {
      // arrange
      const [owner] = await hre.ethers.getSigners();
      const [localChainId, remoteChainId] = [69, 420];

      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const OmniFactoryV2 =
        await hre.ethers.getContractFactory('OmniCoinFactoryV2');

      const lzEndpointMockLocal = await LZEndpointMock.deploy(localChainId);

      const omniFactoryV2Local = await OmniFactoryV2.deploy(
        await lzEndpointMockLocal.getAddress(),
      );

      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
      };

      const tx = await omniFactoryV2Local.deployRemoteCoin(
        coinDetails.name,
        coinDetails.symbol,
        coinDetails.decimals,
        coinDetails.totalSupply,
        remoteChainId,
      );
      await tx.wait();

      const [eventRemoteCoinDeployed] = await omniFactoryV2Local.queryFilter(
        omniFactoryV2Local.filters.RemoteCoinDeployed(),
        'latest',
      );
      const [remoteFactoryAddress, creator, chainId] =
        eventRemoteCoinDeployed.args;

      expect(remoteFactoryAddress).to.not.be.empty;
      expect(creator).to.equal(owner.address);
      expect(chainId).to.equal(remoteChainId);
    });

    it('deploy coin on remote chain', async function () {
      // arrange
      const [owner] = await hre.ethers.getSigners();
      const [localChainId, remoteChainId] = [69, 420];

      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpointMockLocal = await LZEndpointMock.deploy(localChainId);
      const lzEndpointMockRemote = await LZEndpointMock.deploy(remoteChainId);

      const OmniFactoryV2 =
        await hre.ethers.getContractFactory('OmniCoinFactoryV2');
      const omniFactoryV2Local = await OmniFactoryV2.deploy(
        await lzEndpointMockLocal.getAddress(),
      );
      const omniFactoryV2Remote = await OmniFactoryV2.deploy(
        await lzEndpointMockRemote.getAddress(),
      );

      await lzEndpointMockLocal.setDestLzEndpoint(
        await omniFactoryV2Remote.getAddress(),
        await lzEndpointMockRemote.getAddress(),
      );
      await lzEndpointMockRemote.setDestLzEndpoint(
        await omniFactoryV2Local.getAddress(),
        await lzEndpointMockLocal.getAddress(),
      );

      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
      };

      const tx = await omniFactoryV2Local.deployRemoteCoin(
        coinDetails.name,
        coinDetails.symbol,
        coinDetails.decimals,
        coinDetails.totalSupply,
        remoteChainId,
      );
      await tx.wait();

      const [eventLocalCoinDeployed] = await omniFactoryV2Remote.queryFilter(
        omniFactoryV2Remote.filters.LocalCoinDeployed(),
        'latest',
      );
      const [deployedCoinAddress, creator] = eventLocalCoinDeployed.args;

      const coin = await hre.ethers.getContractAt(
        'OmniCoinV2',
        deployedCoinAddress,
      );

      // assert
      expect(deployedCoinAddress).to.not.be.empty;
      expect(creator).to.equal(owner.address);
      expect(await coin.name()).to.equal(coinDetails.name);
      expect(await coin.symbol()).to.equal(coinDetails.symbol);
      expect(await coin.decimals()).to.equal(coinDetails.decimals);
      expect(await coin.totalSupply()).to.equal(coinDetails.totalSupply);
    });
    it('revert when the fee is insufficient', () => {
      expect.fail('not implemented');
    });
    it('revert when the remote chain is not supported', () => {
      expect.fail('not implemented');
    });
  });
  describe('receiveDeployCoinOrder()', function () {
    it('deploy coin when the sender known', () => {
      expect.fail('not implemented');
    });
    it('revert when the sender is unknown', () => {
      expect.fail('not implemented');
    });
  });
  describe('gossipOmnichainData()', function () {
    it('send each coin data to each other', () => {
      expect.fail('not implemented');
    });
    it('revert if the coin is invalid', () => {
      expect.fail('not implemented');
    });
  });
});
