import { atom } from 'jotai';
import { DEFAULT_FEE_RATE } from '@store/common/constants';
import { txForSettingsState } from '@store/transactions/index';
import { getUpdatedTransactionFee } from '@store/transactions/utils';

// This is fixed and doesn't change
export const feeRateState = atom(DEFAULT_FEE_RATE);

export const customAbsoluteTxFee = atom<number | null>(null);

// export const feeRateState = atom<number, number | null>(
//   get => get(customAbsoluteTxFee) || get(transactionRequestCustomFeeRateState) || DEFAULT_FEE_RATE,
//   (_get, set, update) => set(customAbsoluteTxFee, update)
// );

export const currentFeeState = atom(get => {
  const transaction = get(txForSettingsState);
  return transaction?.auth.spendingCondition?.fee.toNumber() || 0;
});

export const currentDefaultFeeState = atom(get => {
  const transaction = get(txForSettingsState);
  if (!transaction) return;
  return getUpdatedTransactionFee(transaction, DEFAULT_FEE_RATE);
});
