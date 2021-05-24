import { useLoadable } from '@common/hooks/use-loadable';
import {
  assetsState,
  fungibleTokensState,
  nonFungibleTokensState,
  stxTokenState,
} from '@store/assets';

export const useAssets = () => {
  return useLoadable(assetsState);
};

export function useFungibleTokenState() {
  return useLoadable(fungibleTokensState);
}

export function useNonFungibleTokenState() {
  return useLoadable(nonFungibleTokensState);
}

export function useStxTokenState() {
  return useLoadable(stxTokenState);
}
