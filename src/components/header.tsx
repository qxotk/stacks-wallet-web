import React, { memo } from 'react';
import { Box, BoxProps, color, Flex, FlexProps, IconButton, Stack } from '@stacks/ui';
import { FiMoreHorizontal as IconDots, FiArrowLeft as IconArrowLeft } from 'react-icons/fi';

import { StacksWalletLogo } from '@components/stacks-wallet-logo';
import { useChangeScreen } from '@common/hooks/use-change-screen';
import { useDrawers } from '@common/hooks/use-drawers';
import { NetworkModeBadge } from '@components/network-mode-badge';
import { Caption, Title } from '@components/typography';
import { ScreenPaths } from '@common/types';

const MenuButton: React.FC<BoxProps> = memo(props => {
  const { showSettings, setShowSettings } = useDrawers();
  return (
    <IconButton
      size="36px"
      iconSize="20px"
      onMouseUp={showSettings ? undefined : () => setShowSettings(true)}
      pointerEvents={showSettings ? 'none' : 'all'}
      color={color('text-caption')}
      _hover={{ color: color('text-title') }}
      data-testid="menu-button"
      icon={IconDots}
      {...props}
    />
  );
});

const HeaderTitle: React.FC<BoxProps> = props => (
  <Title fontSize="20px" lineHeight="28px" fontWeight={500} {...props} />
);

interface HeaderProps extends FlexProps {
  onClose?: () => void;
  hideActions?: boolean;
  title?: string;
}
export const Header: React.FC<HeaderProps> = memo(props => {
  const { onClose, title, hideActions, ...rest } = props;
  const doChangeScreen = useChangeScreen();

  return (
    <Flex
      p="loose"
      alignItems={hideActions ? 'center' : 'flex-start'}
      justifyContent="space-between"
      position="relative"
      {...rest}
    >
      {!title ? (
        <Stack alignItems="center" pt="7px" isInline>
          <StacksWalletLogo onClick={() => doChangeScreen(ScreenPaths.HOME)} />
          {VERSION ? (
            <Caption
              pt="extra-tight"
              color="#8D929A"
              variant="c3"
              marginRight="10px"
              fontFamily="mono"
            >
              v{VERSION}
            </Caption>
          ) : null}
        </Stack>
      ) : (
        <Box pt={onClose ? 'loose' : 'unset'} pr="tight">
          {onClose ? (
            <IconButton
              top="base-tight"
              position="absolute"
              left="base"
              onClick={onClose}
              icon={IconArrowLeft}
            />
          ) : null}
          <HeaderTitle>{title}</HeaderTitle>
        </Box>
      )}
      <Stack flexShrink={0} pt={hideActions ? '7px' : 0} alignItems="center" isInline>
        <NetworkModeBadge />
        {!hideActions && <MenuButton />}
      </Stack>
    </Flex>
  );
});
