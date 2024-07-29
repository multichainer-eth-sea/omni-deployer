import { expect } from 'chai';
import hre from 'hardhat';

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
    it('should deploy coin on single remote chain', async () => {
      // ---------- arrange ---------- //
      // prepare the chain id
      const [CHAIN_A, CHAIN_B] = [69, 420];

      // prepare the owner
      const [owner] = await hre.ethers.getSigners();

      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpointA = await LZEndpointMock.deploy(CHAIN_A);
      const lzEndpointB = await LZEndpointMock.deploy(CHAIN_B);
      const lzEndpointAddressA = await lzEndpointA.getAddress();
      const lzEndpointAddressB = await lzEndpointB.getAddress();

      // deploy the factory contract
      const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
      const factoryContractA = await OmniFactory.deploy(lzEndpointAddressA);
      const factoryContractB = await OmniFactory.deploy(lzEndpointAddressB);
      const factoryContractAddressA = await factoryContractA.getAddress();
      const factoryContractAddressB = await factoryContractB.getAddress();

      // set lzmock endpoint address
      await lzEndpointA.setDestLzEndpoint(
        factoryContractAddressB,
        lzEndpointAddressB,
      );
      await lzEndpointB.setDestLzEndpoint(
        factoryContractAddressA,
        lzEndpointAddressA,
      );

      // set trusted network
      factoryContractA.setTrustedRemote(
        CHAIN_B,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressB, factoryContractAddressA],
        ),
      );
      factoryContractB.setTrustedRemote(
        CHAIN_A,
        hre.ethers.solidityPacked(
          ['address', 'address'],
          [factoryContractAddressA, factoryContractAddressB],
        ),
      );

      // prepare the coin details
      const coinDetails = {
        name: 'Omni Pepe',
        symbol: 'POPO',
        decimals: '18',
        totalSupply: '1000000000000000000000',
      };

      // ---------- act ---------- //
      // get fees
      const [nativeFee] = await factoryContractA.estimateFee(
        coinDetails.name,
        coinDetails.symbol,
        coinDetails.decimals,
        coinDetails.totalSupply,
        [
          {
            _remoteChainId: CHAIN_B,
            _receiver: owner.address,
            _remoteSupplyAmount: coinDetails.totalSupply,
            _remoteFactoryAddress: factoryContractAddressB,
          },
        ],
      );

      // run deployLocalCoin()
      await (
        await factoryContractA.deployRemoteCoin(
          coinDetails.name,
          coinDetails.symbol,
          coinDetails.decimals,
          coinDetails.totalSupply,
          [
            {
              _remoteChainId: CHAIN_B,
              _receiver: owner.address,
              _remoteSupplyAmount: coinDetails.totalSupply,
              _remoteFactoryAddress: factoryContractAddressB,
            },
          ],
          { value: nativeFee },
        )
      ).wait();

      // retreive the coin address deployed
      const [localCoinDeployedEventB] = await factoryContractB.queryFilter(
        factoryContractB.filters.LocalCoinDeployed(),
        'latest',
      );
      const [coinDeployedAddress, receiver] = localCoinDeployedEventB.args;

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
    it('should deploy coin on multiple remote chains', async () => {});
  });
});
