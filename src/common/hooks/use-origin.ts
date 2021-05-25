import { getRequestOrigin, StorageKey } from '@extension/storage';
import { useRecoilValue } from 'recoil';
import { requestTokenState } from '@store/transactions/requests';

export function useOrigin() {
  const requestToken = useRecoilValue(requestTokenState);
  return requestToken ? getRequestOrigin(StorageKey.transactionRequests, requestToken) : null;
}
