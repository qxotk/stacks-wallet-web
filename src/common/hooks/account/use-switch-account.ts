import { useCallback } from 'react';
import { useWallet } from '@common/hooks/use-wallet';
import {
  useCurrentAccount,
  useHasSwitchedAccounts,
  useTransactionAccountIndex,
  useTransactionNetworkVersion,
} from '@store/accounts/account.hooks';

const TIMEOUT = 350;

export const useSwitchAccount = (callback?: () => void) => {
  const { doSwitchAccount } = useWallet();
  const currentAccount = useCurrentAccount();
  const txIndex = useTransactionAccountIndex();
  const transactionVersion = useTransactionNetworkVersion();
  const [hasSwitched, setHasSwitched] = useHasSwitchedAccounts();

  const handleSwitchAccount = useCallback(
    async index => {
      if (typeof txIndex === 'number') setHasSwitched(true);
      await doSwitchAccount(index);
      if (callback) {
        window.setTimeout(() => {
          callback();
        }, TIMEOUT);
      }
    },
    [txIndex, setHasSwitched, doSwitchAccount, callback]
  );

  const getIsActive = useCallback(
    (index: number) =>
      typeof txIndex === 'number' && !hasSwitched
        ? index === txIndex
        : index === currentAccount?.index,
    [txIndex, hasSwitched, currentAccount]
  );

  return { handleSwitchAccount, getIsActive, transactionVersion };
};
