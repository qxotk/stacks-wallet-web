import { useAtomValue, useUpdateAtom } from 'jotai/utils';
import {
  currentNetworkKeyState,
  currentNetworkState,
  currentStacksNetworkState,
  networkOnlineStatusState,
  networksState,
} from './networks';

export function useCurrentNetworkState() {
  return useAtomValue(currentNetworkState);
}

export function useNetworkState() {
  return useAtomValue(networksState);
}

export function useCurrentStacksNetworkState() {
  return useAtomValue(currentStacksNetworkState);
}

export function useUpdateNetworkState() {
  return useUpdateAtom(networksState);
}

export function useCurrentNetworkKey() {
  return useAtomValue(currentNetworkKeyState);
}

export function useUpdateCurrentNetworkKey() {
  return useUpdateAtom(currentNetworkKeyState);
}

export function useNetworkOnlineStatusState(networkUrl: string) {
  return useAtomValue(networkOnlineStatusState(networkUrl));
}
