import { BigNumber } from 'bignumber.js';

export type BigNumberValue = string | number | BigNumber;

export const BigNumberZeroDecimal = BigNumber.clone({
  DECIMAL_PLACES: 0,
  ROUNDING_MODE: BigNumber.ROUND_DOWN,
});

export function valueToBigInt(amount: BigNumberValue): bigint {
  return BigInt(valueToBigNumber(amount).toString(10));
}

export function valueToBigNumber(amount: BigNumberValue): BigNumber {
  if (amount instanceof BigNumber) {
    return amount;
  }

  return new BigNumber(amount);
}

export function valueToZDBigNumber(amount: BigNumberValue): BigNumber {
  return new BigNumberZeroDecimal(amount);
}

export function normalize(n: BigNumberValue, decimals: number): string {
  return normalizeBN(n, decimals).toString(10);
}

export function normalizeBN(n: BigNumberValue, decimals: number): BigNumber {
  return valueToBigNumber(n).shiftedBy(decimals * -1);
}

export function denormalize(n: BigNumberValue, decimals: number): string {
  return denormalizeBN(n, decimals).toString(10);
}

export function denormalizeBN(n: BigNumberValue, decimals: number): BigNumber {
  const bn = valueToBigNumber(n);
  const dp = bn.dp() || 0;

  if (dp > decimals) {
    throw new Error(
      `Too many decimal places: ${n}, expected ${decimals} but got ${dp}`,
    );
  }
  return bn.shiftedBy(decimals);
}

export const BN_ONE_18_DECIMALS = denormalizeBN(1, 18);

