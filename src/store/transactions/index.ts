import { selector, waitForAll } from 'recoil';
import { ChainID } from '@stacks/transactions';
import { StacksMainnet, StacksTestnet } from '@stacks/network';
import { TransactionTypes } from '@stacks/connect';

import { currentNetworkState } from '@store/networks';
import { correctNonceState } from '@store/accounts/nonce';
import { smartContractClientState } from '@store/api-clients';
import { currentAccountState, currentAccountStxAddressState } from '@store/accounts';
import { requestTokenPayloadState } from '@store/transactions/requests';

import { getPostCondition, handlePostConditions } from '@common/post-condition-utils';
import { generateTransaction } from '@common/transaction-utils';

import type { ContractInterfaceResponse } from '@stacks/blockchain-api-client';
import type { ContractInterfaceFunction } from '@stacks/rpc-client';

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

type ContractInterfaceResponseWithFunctions = Omit<ContractInterfaceResponse, 'functions'> & {
  functions: ContractInterfaceFunction[];
};
export const transactionContractInterfaceState = selector<
  undefined | ContractInterfaceResponseWithFunctions
>({
  key: 'transactions.contract-interface',
  get: async ({ get }) => {
    const { payload, client } = get(
      waitForAll({
        payload: requestTokenPayloadState,
        client: smartContractClientState,
      })
    );

    if (payload?.txType !== TransactionTypes.ContractCall) return;
    try {
      const data = await client.getContractInterface({
        contractName: payload.contractName,
        contractAddress: payload.contractAddress,
      });
      if (!data) return undefined;
      return data as ContractInterfaceResponseWithFunctions;
    } catch (e) {
      return undefined;
    }
  },
});

export const transactionContractSourceState = selector({
  key: 'transactions.contract-source',
  get: async ({ get }) => {
    const { payload, client } = get(
      waitForAll({
        payload: requestTokenPayloadState,
        client: smartContractClientState,
      })
    );

    if (payload?.txType !== TransactionTypes.ContractCall) return;

    try {
      return client.getContractSource({
        contractName: payload.contractName,
        contractAddress: payload.contractAddress,
      });
    } catch (e) {
      return undefined;
    }
  },
});

export const transactionFunctionsState = selector({
  key: 'transactions.pending-transaction-function',
  get: ({ get }) => {
    const { payload, contractInterface } = get(
      waitForAll({
        payload: requestTokenPayloadState,
        contractInterface: transactionContractInterfaceState,
      })
    );

    if (!payload || payload.txType !== 'contract_call' || !contractInterface) return undefined;

    const selectedFunction = contractInterface.functions.find(func => {
      return func.name === payload.functionName;
    });
    if (!selectedFunction) {
      throw new Error(
        `Attempting to call a function (\`${payload.functionName}\`) that ` +
          `does not exist on contract ${payload.contractAddress}.${payload.contractName}`
      );
    }
    return selectedFunction;
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
    return generateTransaction({
      senderKey: account.stxPrivateKey,
      nonce,
      txData: pendingTransaction,
    });
  },
});
