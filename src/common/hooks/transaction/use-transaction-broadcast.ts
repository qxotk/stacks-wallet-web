import { useWallet } from '@common/hooks/use-wallet';
import { useRecoilCallback, waitForAll } from 'recoil';
import { currentAccountState } from '@store/accounts';
import { correctNonceState } from '@store/accounts/nonce';
import { pendingTransactionState, transactionBroadcastErrorState } from '@store/transactions';
import { requestTokenState } from '@store/transactions/requests';
import { currentNetworkState } from '@store/networks';
import { finalizeTxSignature } from '@common/utils';
import {
  generateSignedTransaction,
  handleBroadcastTransaction,
} from '@common/transactions/transactions';

export function useTransactionBroadcast() {
  const { doSetLatestNonce } = useWallet();
  return useRecoilCallback(
    ({ snapshot, set }) =>
      async () => {
        const { account, nonce, pendingTransaction, requestToken, network } =
          await snapshot.getPromise(
            waitForAll({
              account: currentAccountState,
              nonce: correctNonceState,
              pendingTransaction: pendingTransactionState,
              requestToken: requestTokenState,
              network: currentNetworkState,
            })
          );

        if (!pendingTransaction || !account || !requestToken) {
          set(transactionBroadcastErrorState, 'No pending transaction found.');
          return;
        }

        try {
          const signedTransaction = await generateSignedTransaction({
            txData: pendingTransaction,
            senderKey: account?.stxPrivateKey,
            nonce,
          });
          const result = await handleBroadcastTransaction(
            signedTransaction,
            pendingTransaction,
            network.url
          );
          await doSetLatestNonce(signedTransaction);
          finalizeTxSignature(requestToken, result);
        } catch (error) {
          set(transactionBroadcastErrorState, error.message);
        }
      },
    [doSetLatestNonce]
  );
}
