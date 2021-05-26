import { accountNameState } from '@store/accounts/names';
import { useLoadable } from '@common/hooks/use-loadable';
import { useCurrentAccount } from '@common/hooks/account/use-current-account';

export function useAccountNames() {
  return useLoadable(accountNameState);
}

export function useAccountDisplayName(index?: number) {
  const names = useAccountNames();
  const account = useCurrentAccount();
  if (typeof index === 'number') {
    return names.value?.[index]?.names?.[0] || `Account ${index + 1}`;
  }
  if (!account || typeof account?.index !== 'number') return 'Account';
  return names.value?.[index || account.index]?.names?.[0] || `Account ${account?.index + 1}`;
}
