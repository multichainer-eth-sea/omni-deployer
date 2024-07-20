import { buildModule } from '@nomicfoundation/hardhat-ignition/modules';

const OmniCoinModule = buildModule('OmniCoin', (m) => {
  const coinName = m.getParameter('name', 'Coin Name');
  const coinSymbol = m.getParameter('symbol', 'TICKER');
  const coinDecimals = m.getParameter('decimals', '18');
  const coinTotalSupply = m.getParameter(
    'totalSupply',
    '100000000000000000000',
  );
  const receiver = m.getParameter(
    'receiver',
    '0x976922801d71035C17967F2FEE7E137503aea6C0',
  );

  const omniCoin = m.contract('OmniCoin', [
    coinName,
    coinSymbol,
    coinDecimals,
    coinTotalSupply,
    receiver,
  ]);

  return { omniCoin };
});

export default OmniCoinModule;
