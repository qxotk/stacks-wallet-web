import { atom, selector, waitForAll } from 'recoil';
import { ChainID } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';

import { currentNetworkState } from '@store/networks';
import { correctNonceState } from '@store/accounts/nonce';
import { currentAccountState, currentAccountStxAddressState } from '@store/accounts';
import { requestTokenPayloadState } from '@store/transactions/requests';

import { generateSignedTransaction } from '@common/transactions/transactions';
import { getPostCondition, handlePostConditions } from '@common/transactions/postcondition-utils';
import { TransactionPayload } from '@stacks/connect';

export const postConditionsState = selector({
  key: 'transactions.post-conditions',
  get: ({ get }) => {
    const { payload, address } = get(
      waitForAll({
        payload: requestTokenPayloadState,
        address: currentAccountStxAddressState,
      })
    );

    if (!payload || !address) return;

    if (payload.postConditions) {
      if (payload.stxAddress)
        return handlePostConditions(payload.postConditions, payload.stxAddress, address);

      return payload.postConditions.map(getPostCondition);
    }
    return [];
  },
});

export const pendingTransactionState = selector({
  key: 'transactions.pending',
  get: ({ get }) => {
    const { payload, postConditions, _network } = get(
      waitForAll({
        payload: requestTokenPayloadState,
        postConditions: postConditionsState,
        _network: currentNetworkState,
      })
    );
    const network =
      _network.chainId === ChainID.Mainnet ? new StacksMainnet() : new StacksTestnet();
    network.coreApiUrl = _network.url;
    if (!payload) return;
    return { ...payload, postConditions, network };
  },
});

export const signedTransactionState = selector({
  key: 'transactions.signed',
  get: async ({ get }) => {
    const { account, pendingTransaction, nonce } = get(
      waitForAll({
        account: currentAccountState,
        pendingTransaction: pendingTransactionState,
        nonce: correctNonceState,
      })
    );
    if (!account || !pendingTransaction) return;
    return generateSignedTransaction({
      senderKey: account.stxPrivateKey,
      nonce,
      txData: pendingTransaction,
    });
  },
});
export type TransactionPayloadWithAttachment = TransactionPayload & {
  attachment?: string;
};
export const isUnauthorizedTransactionState = atom<boolean>({
  key: 'transaction.is-unauthorized-tx',
  default: false,
});
export const transactionBroadcastErrorState = atom<string | null>({
  key: 'transaction.broadcast-error',
  default: null,
});
