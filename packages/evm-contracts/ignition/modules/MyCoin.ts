import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const MyCoinModule = buildModule('MyCoin', (m) => {
  const coinName = m.getParameter('name', 'My Awesome Coin');
  const coinSymbol = m.getParameter('symbol', 'AWESOME');
  const coinDecimals = m.getParameter('decimals', '18');
  const coinTotalSupply = m.getParameter(
    'totalSupply',
    '100000000000000000000',
  );

  const myCoin = m.contract('MyCoin', [
    coinName,
    coinSymbol,
    coinDecimals,
    coinTotalSupply,
  ]);

  return { myCoin };
});

export default MyCoinModule;
