import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const OmniCoinFactoryModule = buildModule('OmniCoinFactory', (m) => {
  const omniCoinFactory = m.contract('OmniCoinFactory');

  return { omniCoinFactory };
});

export default OmniCoinFactoryModule;
