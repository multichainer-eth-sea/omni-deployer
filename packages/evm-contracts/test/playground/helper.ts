import hre from 'hardhat';
import { LzApp } from '../../typechain-types';

export type Person = {
  _chainId: number;
  _address: string;
  _donation: bigint;
};

export const prepareTestEnvironments = async <T extends LzApp>(
  chainIds: number[],
  contractFactory: string,
) => {
  // prepare the endpoints
  const LZEndpointMock = await hre.ethers.getContractFactory('LZEndpointMock');
  const lzEndpoints = await Promise.all(
    chainIds.map(async (chainId) => await LZEndpointMock.deploy(chainId)),
  );
  const lzEndpointAddresses = await Promise.all(
    lzEndpoints.map(async (lzEndpoint) => await lzEndpoint.getAddress()),
  );

  // deploy the factory contract
  const ContractFactory = await hre.ethers.getContractFactory(contractFactory);
  const contractList = await Promise.all(
    lzEndpointAddresses.map(
      async (lzEndpointAddress) =>
        (await ContractFactory.deploy(lzEndpointAddress)) as T,
    ),
  );
  const contractAddresses = await Promise.all(
    contractList.map(async (contract) => await contract.getAddress()),
  );

  // set lzmock endpoint address
  for (let i = 0; i < chainIds.length; i++) {
    for (let j = 0; j < chainIds.length; j++) {
      if (i !== j) {
        await lzEndpoints[i].setDestLzEndpoint(
          contractAddresses[j],
          lzEndpointAddresses[j],
        );
      }
    }
  }

  // set trusted network
  for (let i = 0; i < chainIds.length; i++) {
    for (let j = 0; j < chainIds.length; j++) {
      if (i !== j) {
        await contractList[i].setTrustedRemote(
          chainIds[j],
          hre.ethers.solidityPacked(
            ['address', 'address'],
            [contractAddresses[j], contractAddresses[i]],
          ),
        );
      }
    }
  }
  return {
    chainIds,
    lzEndpoints,
    lzEndpointAddresses,
    contractList,
    contractAddresses,
  };
};
