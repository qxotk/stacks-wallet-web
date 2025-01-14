import { atom } from 'jotai';
import { DEFAULT_FEE_RATE, DEFAULT_FEE_RATE_MULTIPLIER } from '@store/common/constants';
import { txForSettingsState } from '@store/transactions/index';
import { transactionRequestCustomFeeRateState } from '@store/transactions/requests';
import { getUpdatedTransactionFee } from '@store/transactions/utils';

export const feeRateMultiplierCustomState = atom<number | undefined>(undefined);
export const feeRateUseCustom = atom<boolean>(false);
export const feeRateMultiplierState = atom<number, number | undefined>(
  get => {
    const useCustom = get(feeRateUseCustom);
    if (!useCustom) return DEFAULT_FEE_RATE_MULTIPLIER;
    return get(feeRateMultiplierCustomState) || DEFAULT_FEE_RATE_MULTIPLIER;
  },
  (_get, set, update) => {
    set(feeRateMultiplierCustomState, update);
  }
);

export const feeRateCustomState = atom<number | undefined>(undefined);
export const feeRateState = atom<number, number | undefined>(
  get => {
    return get(feeRateCustomState) || get(transactionRequestCustomFeeRateState) || DEFAULT_FEE_RATE;
  },
  (_get, set, update) => set(feeRateCustomState, update)
);

export const currentFeeRateState = atom(get => get(feeRateState) * get(feeRateMultiplierState));

export const currentFeeState = atom(get => {
  const transaction = get(txForSettingsState);
  return transaction?.auth.spendingCondition?.fee.toNumber() || 0;
});

export const currentDefaultFeeState = atom(get => {
  const transaction = get(txForSettingsState);
  if (!transaction) return;
  return getUpdatedTransactionFee(transaction, DEFAULT_FEE_RATE);
});
