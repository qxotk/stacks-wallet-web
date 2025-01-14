import BigNumber from 'bignumber.js';
import { initBigNumber } from '@common/utils';
import { microStxToStx } from '@common/stacks-utils';
import { SendFormErrorMessages } from '@common/error-messages';

export function formatPrecisionError(symbol: string, decimals: number) {
  const error = SendFormErrorMessages.TooMuchPrecision;
  return error.replace('{token}', symbol).replace('{decimals}', String(decimals));
}

export function formatInsufficientBalanceError(
  availableBalance?: BigNumber | string,
  symbol?: string
) {
  if (!availableBalance || !symbol) return;
  const isStx = symbol === 'STX';
  const amount = initBigNumber(availableBalance);
  const formattedAmount = isStx ? microStxToStx(amount).toString() : amount.toString(10);
  return `${SendFormErrorMessages.InsufficientBalance} ${
    amount.lt(0) ? '0' : formattedAmount
  } ${symbol}`;
}
