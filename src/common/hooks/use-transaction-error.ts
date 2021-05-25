import {
  useSignedTransaction,
  useTransactionContractInterface,
  useTransactionRequest,
} from '@common/hooks/use-transaction';
import { useRecoilValue } from 'recoil';
import { isUnauthorizedTransactionStore } from '@store/transaction';
import { useWallet } from '@common/hooks/use-wallet';
import { useFetchBalances } from '@common/hooks/use-account-info';
import { useMemo } from 'react';
import { TransactionErrorReason } from '@pages/transaction/transaction-error';
import BigNumber from 'bignumber.js';
import { TransactionTypes } from '@stacks/connect';
import { AuthType } from '@stacks/transactions';

function useFee() {
  const signedTransaction = useSignedTransaction();
  if (!signedTransaction.value) return;
  const isSponsored = signedTransaction.value.auth.authType === AuthType.Sponsored;
  const amount = signedTransaction.value.auth.spendingCondition?.fee?.toNumber();
  return {
    amount,
    isSponsored,
  };
}

export function useTransactionError() {
  const transactionRequest = useTransactionRequest();
  const fee = useFee();
  const contractInterface = useTransactionContractInterface();
  const isUnauthorizedTransaction = useRecoilValue(isUnauthorizedTransactionStore);
  const { currentAccount } = useWallet();
  const balances = useFetchBalances();
  return useMemo<TransactionErrorReason | void>(() => {
    if (isUnauthorizedTransaction) return TransactionErrorReason.Unauthorized;

    if (!transactionRequest || balances.errorMaybe() || !currentAccount) {
      return TransactionErrorReason.Generic;
    }
    if (
      transactionRequest.txType === TransactionTypes.ContractCall &&
      !contractInterface.isLoading &&
      !contractInterface.contents
    )
      return TransactionErrorReason.NoContract;
    // if (broadcastError) return TransactionErrorReason.BroadcastError;

    if (balances.value) {
      const stxBalance = new BigNumber(balances.value.stx.balance);
      if (transactionRequest.txType === TransactionTypes.STXTransfer) {
        const transferAmount = new BigNumber(transactionRequest.amount);
        if (transferAmount.gte(stxBalance))
          return TransactionErrorReason.StxTransferInsufficientFunds;
      }
      if (fee && !fee.isSponsored && fee.amount) {
        const feeAmount = new BigNumber(fee.amount);
        if (feeAmount.gte(stxBalance)) return TransactionErrorReason.FeeInsufficientFunds;
      }
    }
    return;
  }, [
    fee,
    contractInterface,
    balances,
    currentAccount,
    transactionRequest,
    isUnauthorizedTransaction,
  ]);
}
