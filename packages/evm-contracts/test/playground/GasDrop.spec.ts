import hre from 'hardhat';
import { expect } from 'chai';
import { prepareTestEnvironments, Person } from './helper';
import { GasDrop } from '../../typechain-types';

describe('GasDrop', () => {
  describe('(deployment)', () => {
    it('should set the right layerzero endpoint', async () => {
      // ---------- arrange ---------- //
      // prepare the endpoints
      const LZEndpointMock =
        await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpoint = await LZEndpointMock.deploy(1);
      const lzEndpointAddress = await lzEndpoint.getAddress();

      // deploy the factory contract
      const GasDrop = await hre.ethers.getContractFactory('GasDrop');
      const gasDropContract = await GasDrop.deploy(lzEndpointAddress);

      // ---------- act ---------- //
      const actual = await gasDropContract.lzEndpoint();

      // ---------- assert ---------- //
      expect(actual).to.equal(lzEndpointAddress);
    });
  });

  describe('(test helper)', () => {
    it('should emit DonationReceived event', async () => {
      // ---------- arrange ---------- //
      const [owner] = await hre.ethers.getSigners();

      // prepare the test environment
      const { chainIds, contractAddresses, contractList } =
        await prepareTestEnvironments([69, 420, 1337], 'GasDrop');

      console.log(contractAddresses);
    });
  });

  describe('sendEtherOmnichain()', () => {
    it('should emit EtherDropSent event', async () => {
      // ---------- arrange ---------- //
      const [alice, bob] = await hre.ethers.getSigners();

      // prepare the test environment
      const { chainIds, contractAddresses, contractList } =
        await prepareTestEnvironments<GasDrop>([69, 420, 1337], 'GasDrop');

      const totalEthersSent = await contractList[0].estimateFeesWithTotalEthers(
        chainIds[1],
        hre.ethers.parseEther('0.069'),
        bob.address,
      );
      const tx = await contractList[0].sendEtherOmnichain(
        chainIds[1],
        hre.ethers.parseEther('0.069'),
        bob.address,
        { value: totalEthersSent },
      );
      await tx.wait();

      await (async () => {
        const [eventLog] = await contractList[0].queryFilter(
          contractList[0].filters.EtherDropSent(),
        );
        console.log('====================');
        console.log('ether drop sent', {
          eventName: eventLog.fragment.name,
          args: eventLog.args,
        });
      })();

      await (async () => {
        const [eventLog] = await contractList[1].queryFilter(
          contractList[1].filters.EtherDropReceived(),
        );
        console.log('====================');
        console.log('ether drop received', {
          eventName: eventLog.fragment.name,
          args: eventLog.args,
        });
      })();
    });
  });
});
