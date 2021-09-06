import React, { useCallback } from 'react';

import { Box, Flex, Button, Stack, color, FlexProps, BoxProps } from '@stacks/ui';
import { ControlledDrawer } from '@components/drawer/controlled';
import { useWallet } from '@common/hooks/use-wallet';
import { CheckmarkIcon } from '@components/icons/checkmark-icon';
import { useChangeScreen } from '@common/hooks/use-change-screen';
import { ScreenPaths } from '@common/types';
import { useDrawers } from '@common/hooks/use-drawers';
import { Caption, Title } from '@components/typography';
import { getUrlHostname } from '@common/utils';
import { FiCloudOff as IconCloudOff } from 'react-icons/fi';
import { SettingsSelectors } from '@tests/integration/settings.selectors';
import {
  useNetworkOnlineStatusState,
  useUpdateCurrentNetworkKey,
} from '@store/network/networks.hooks';
import { useShowNetworksStore } from '@store/ui/ui.hooks';

const NetworkListItem: React.FC<{ item: string } & BoxProps> = ({ item, ...props }) => {
  const { setShowNetworks } = useDrawers();
  const { networks, currentNetworkKey } = useWallet();
  const setCurrentNetworkKey = useUpdateCurrentNetworkKey();
  const network = networks[item];
  const { isOnline } = useNetworkOnlineStatusState(network.url);
  const isActive = item === currentNetworkKey;

  const handleItemClick = useCallback(() => {
    setCurrentNetworkKey(item);
    setTimeout(() => setShowNetworks(false), 25);
  }, [setCurrentNetworkKey, item, setShowNetworks]);

  return (
    <Box
      width="100%"
      key={item}
      _hover={
        !isOnline || isActive
          ? undefined
          : {
              backgroundColor: color('bg-4'),
            }
      }
      px="loose"
      py="base"
      onClick={!isOnline || isActive ? undefined : handleItemClick}
      cursor={!isOnline ? 'not-allowed' : isActive ? 'default' : 'pointer'}
      opacity={!isOnline ? 0.5 : 1}
      {...props}
    >
      <Flex width="100%" justifyContent="space-between" alignItems="center">
        <Stack>
          <Title
            fontWeight={400}
            lineHeight="1rem"
            fontSize={2}
            display="block"
            fontFamily="'Inter'"
          >
            {network.name}
          </Title>
          <Caption>{getUrlHostname(network.url)}</Caption>
        </Stack>
        {!isOnline ? <IconCloudOff /> : item === currentNetworkKey ? <CheckmarkIcon /> : null}
      </Flex>
    </Box>
  );
};

const NetworkList: React.FC<FlexProps> = props => {
  const { networks } = useWallet();

  const items = Object.keys(networks);
  return (
    <Flex flexWrap="wrap" flexDirection="column" {...props}>
      {items.map(item => (
        <React.Suspense key={item} fallback={<>Loading</>}>
          <NetworkListItem data-testid={SettingsSelectors.NetworkListItem} item={item} />
        </React.Suspense>
      ))}
    </Flex>
  );
};

export const NetworksDrawer: React.FC = () => {
  const { setShowNetworks } = useDrawers();
  const [isShowing] = useShowNetworksStore();
  const doChangeScreen = useChangeScreen();

  const handleAddNetworkClick = useCallback(() => {
    setShowNetworks(false);
    doChangeScreen(ScreenPaths.ADD_NETWORK);
  }, [setShowNetworks, doChangeScreen]);

  return (
    <ControlledDrawer
      title="Select Network"
      isShowing={isShowing}
      onClose={() => setShowNetworks(false)}
    >
      {isShowing && <NetworkList />}
      <Box pb="loose" width="100%" px="loose" mt="base">
        <Button borderRadius="10px" onClick={handleAddNetworkClick}>
          Add a network
        </Button>
      </Box>
    </ControlledDrawer>
  );
};
