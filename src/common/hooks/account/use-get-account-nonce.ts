import { apiClientState } from '@store/common/api-clients';
import { currentAccountStxAddressState } from '@store/accounts';
import { useQuery, UseQueryOptions } from 'react-query';
import { useAtomValue } from 'jotai/utils';
import { currentNetworkState } from '@store/networks';

export function useGetAccountNonce(reactQueryOptions: UseQueryOptions = {}) {
  const principal = useAtomValue(currentAccountStxAddressState);
  const network = useAtomValue(currentNetworkState);
  const { accountsApi } = useAtomValue(apiClientState);
  const fetchNonce = () => {
    if (!principal) return;
    return accountsApi.getAccountNonces({ principal });
  };

  return useQuery(['getAccountNonce', principal, network], fetchNonce, {
    enabled: !!principal,
    ...reactQueryOptions,
  });
}
