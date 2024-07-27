import { expect } from 'chai';
import hre from 'hardhat';

describe('OmniFactoryV3',  () => {
  describe('(deployment)',  () => {
    it('should set the right layerzero endpoint', async () => {
      // ---------- arrange ---------- //
      // prepare the endpoints
      const LZEndpointMock = await hre.ethers.getContractFactory('LZEndpointMock');
      const lzEndpoint = await LZEndpointMock.deploy(1);
      const lzEndpointAddress = await lzEndpoint.getAddress();
    
      // deploy the factory contract
      const OmniFactoryV3 = await hre.ethers.getContractFactory('OmniFactoryV3');
      const factoryContract = await OmniFactoryV3.deploy(lzEndpointAddress);

      // ---------- act ---------- //
      const actual = await factoryContract.lzEndpoint();

      // ---------- assert ---------- //
      expect(actual).to.equal(lzEndpointAddress);
    })
  })
})
