import { atom, selector } from 'recoil';
import { assetsState } from '@store/assets/index';
import { AssetWithMeta } from '@store/assets/types';

enum KEYS {
  ASSET_ID = 'asset-search/ASSET_ID',
  ASSET = 'asset-search/ASSET',
  INPUT = 'asset-search/INPUT',
}

export const selectedAssetIdState = atom<string | undefined>({
  key: KEYS.ASSET_ID,
  default: undefined,
});

export const selectedAssetStore = selector<AssetWithMeta | undefined>({
  key: KEYS.ASSET,
  get: ({ get }) => {
    const id = get(selectedAssetIdState);
    const assets = get(assetsState);
    return assets?.find(asset => asset.name === id);
  },
});

export const searchInputStore = atom<string>({
  key: KEYS.INPUT,
  default: '',
});
