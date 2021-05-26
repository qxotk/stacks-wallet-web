import { atom, DefaultValue, selector, waitForAll } from 'recoil';
import { localStorageEffect } from './common/utils';
import { ChainID, TransactionVersion } from '@stacks/transactions';
import { StacksNetwork, StacksTestnet, StacksMainnet } from '@stacks/network';
import { apiRevalidation } from '@store/common/api-helpers';
import { transactionRequestNetwork } from '@store/transactions/requests';
import { findMatchingNetworkKey } from '@common/utils';
import { defaultNetworks, Networks } from '@common/constants';
import { blocksApiClientState, infoApiClientState } from '@store/common/api-clients';

export const networksState = atom<Networks>({
  key: 'networks',
  default: defaultNetworks,
  effects_UNSTABLE: [localStorageEffect()],
});

export const currentNetworkKeyState = atom({
  key: 'networks.current-key',
  default: selector({
    key: 'networks.current-key.default',
    get: ({ get }) => {
      const { networks, txNetwork } = get(
        waitForAll({
          networks: networksState,
          txNetwork: transactionRequestNetwork,
        })
      );
      if (txNetwork && networks && Object.keys(networks).length > 0) {
        const newKey = findMatchingNetworkKey(txNetwork, networks);
        if (newKey) return newKey;
      } else {
        const savedValue = localStorage.getItem('networks.current-key');
        if (savedValue) {
          try {
            return JSON.parse(savedValue);
          } catch (e) {}
        }
      }
      return 'mainnet';
    },
  }),
  effects_UNSTABLE: [
    ({ onSet }) => {
      onSet(newValue => {
        if (newValue instanceof DefaultValue) {
          localStorage.removeItem('networks.current-key');
        } else {
          localStorage.setItem('networks.current-key', JSON.stringify(newValue));
        }
      });
    },
  ],
});

export const currentNetworkState = selector({
  key: 'networks.current-network',
  get: ({ get }) => {
    const { networks, key } = get(
      waitForAll({
        networks: networksState,
        key: currentNetworkKeyState,
      })
    );
    return networks[key];
  },
});

export const networkTransactionVersionState = selector({
  key: 'networks.transaction-version',
  get: ({ get }) =>
    get(currentNetworkState).chainId === ChainID.Mainnet
      ? TransactionVersion.Mainnet
      : TransactionVersion.Testnet,
});

export const stacksNetworkStore = selector<StacksNetwork>({
  key: 'networks.stacks-network',
  get: ({ get }) => {
    const network = get(currentNetworkState);
    const stacksNetwork =
      network.chainId === ChainID.Testnet ? new StacksTestnet() : new StacksMainnet();
    stacksNetwork.coreApiUrl = network.url;
    return stacksNetwork;
  },
});

export const latestBlockHeightState = selector({
  key: 'api.latest-block-height',
  get: async ({ get }) => {
    const client = get(blocksApiClientState);
    const data = await client.getBlockList({});
    return data?.results?.[0]?.height;
  },
});

export const networkInfoState = selector({
  key: 'api.network-info',
  get: async ({ get }) => {
    get(apiRevalidation);
    const client = get(infoApiClientState);
    return client.getCoreApiInfo();
  },
});
