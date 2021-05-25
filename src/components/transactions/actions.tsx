import { Button, color, Stack, StackProps } from '@stacks/ui';
import { useTxState } from '@common/hooks/use-tx-state';
import { useLoadable } from '@common/hooks/use-loadable';
import { signedTransactionState } from '@store/transactions';
import { useLoading } from '@common/hooks/use-loading';
import React, { memo, useCallback } from 'react';
import { useDrawers } from '@common/hooks/use-drawers';
import { SpaceBetween } from '@components/space-between';
import { Caption } from '@components/typography';
import { NetworkRowItem } from '@components/network-row-item';
import { useTransactionError } from '@common/hooks/use-transaction-error';
import { FeeComponent } from '@components/transactions/fee';

export const TransactionsActions = memo((props: StackProps) => {
  const { handleSubmitPendingTransaction } = useTxState();
  const signedTransaction = useLoadable(signedTransactionState);
  const { setIsLoading, setIsIdle, isLoading } = useLoading('TRANSACTIONS_ACTIONS');
  const handleSubmit = useCallback(async () => {
    setIsLoading();
    await handleSubmitPendingTransaction();
    setIsIdle();
  }, [setIsLoading, setIsIdle, handleSubmitPendingTransaction]);
  const { setShowNetworks } = useDrawers();
  const error = useTransactionError();

  return (
    <Stack mt="auto" pt="loose" spacing="loose" bg={color('bg')} {...props}>
      <Stack spacing="base-loose">
        <SpaceBetween>
          <Caption>Fees</Caption>
          <Caption>
            <FeeComponent />
          </Caption>
        </SpaceBetween>
        <SpaceBetween>
          <Caption>Network</Caption>
          <NetworkRowItem onClick={() => setShowNetworks(true)} />
        </SpaceBetween>
      </Stack>
      <Button
        borderRadius="12px"
        py="base"
        width="100%"
        onClick={handleSubmit}
        isLoading={isLoading}
        isDisabled={!!error || !signedTransaction.value}
      >
        Confirm
      </Button>
    </Stack>
  );
});
