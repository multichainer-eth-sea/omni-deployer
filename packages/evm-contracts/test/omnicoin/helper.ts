import hre from 'hardhat';
import { OmniCoin, OmniFactory } from '../../typechain-types';

export type CoinDetailsRemoteConfig = {
  remoteChainId: number;
  receiver: string;
  remoteSupplyAmount: string;
  remoteFactoryAddress: string;
};
export type CoinDetails = {
  name: string;
  symbol: string;
  decimals: string;
  totalSupply: string;
  remoteConfigs: CoinDetailsRemoteConfig[];
};

export const prepareTestEnvironments = async (chainIds: number[]) => {
  // prepare the endpoints
  const LZEndpointMock = await hre.ethers.getContractFactory('LZEndpointMock');
  const lzEndpoints = await Promise.all(
    chainIds.map(async (chainId) => await LZEndpointMock.deploy(chainId)),
  );
  const lzEndpointAddresses = await Promise.all(
    lzEndpoints.map(async (lzEndpoint) => await lzEndpoint.getAddress()),
  );

  // deploy the factory storage contract
  const OmniFactoryStorage =
    await hre.ethers.getContractFactory('OmniFactoryStorage');
  const omniFactoryStorages = await Promise.all(
    lzEndpointAddresses.map(async () => await OmniFactoryStorage.deploy()),
  );

  // deploy the factory contract
  const OmniFactory = await hre.ethers.getContractFactory('OmniFactory');
  const omniFactories = await Promise.all(
    lzEndpointAddresses.map(
      async (lzEndpointAddress, index) =>
        await OmniFactory.deploy(lzEndpointAddress, omniFactoryStorages[index]),
    ),
  );
  const omniFactoryAddresses = await Promise.all(
    omniFactories.map(async (omniFactory) => await omniFactory.getAddress()),
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
  return {
    chainIds,
    lzEndpoints,
    lzEndpointAddresses,
    omniFactories,
    omniFactoryAddresses,
    omniFactoryStorages,
  };
};

export const getEstimatedDeployFees = async (
  omniFactory: OmniFactory,
  coinDetails: CoinDetails,
) => {
  const nativeFees = await omniFactory.estimateDeployFee(
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

  return { nativeFees, totalNativeFees };
};

export const getEstimatedVerifyFees = async (
  omniFactory: OmniFactory,
  deploymentId: string,
  chainIds: number[],
) => {
  const nativeFees = await omniFactory.estimateVerifyFee(
    deploymentId,
    chainIds,
  );
  const totalNativeFees = nativeFees.reduce((acc, cur) => (acc += cur), 0n);

  return { nativeFees, totalNativeFees };
};

export const getLocalCoinDeployedAddress = async (omniFactory: OmniFactory) => {
  const [localCoinDeployedEvent] = await omniFactory.queryFilter(
    omniFactory.filters.LocalCoinDeployed(),
    'latest',
  );
  const [deploymentId, coinDeployedAddress, receiverAddress] =
    localCoinDeployedEvent.args;
  const coinDeployed = await hre.ethers.getContractAt(
    'OmniCoin',
    coinDeployedAddress,
  );

  const chainId = await omniFactory.getChainId();

  return {
    chainId,
    deploymentId,
    coinDeployed,
    coinDeployedAddress,
    receiverAddress,
  };
};

export const getOmniCoinTransferEvents = async (coin: OmniCoin) => {
  const transferEvents = await coin.queryFilter(coin.filters.Transfer());
  return transferEvents.map((event) => ({
    address: event.address,
    eventName: 'Transfer',
    from: event.args[0],
    to: event.args[1],
    value: event.args[2],
  }));
};
