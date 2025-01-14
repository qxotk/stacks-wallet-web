import React, { memo, useCallback } from 'react';
import { Box, Button, ButtonProps, color, Flex, Stack, StackProps } from '@stacks/ui';
import { LOADING_KEYS, useLoading } from '@common/hooks/use-loading';
import { SpaceBetween } from '@components/space-between';
import { Caption } from '@components/typography';
import { NetworkRowItem } from '@components/network-row-item';
import { FeeComponent } from '@pages/transaction-signing/components/fee';
import { FiAlertTriangle } from 'react-icons/fi';

import { TransactionErrorReason } from './transaction-error';
import { LoadingRectangle } from '@components/loading-rectangle';
import { TransactionsSelectors } from '@tests/integration/transactions.selectors';
import { useTransactionError } from '../hooks/use-transaction-error';
import {
  useTransactionBroadcastError,
  useTransactionRequest,
} from '@store/transactions/requests.hooks';
import { useTransactionBroadcast } from '@store/transactions/transaction.hooks';
import {
  ShowTxSettingsAction,
  ShowTxSettingsPlaceholder,
} from '@features/fee-nonce-drawers/components/show-tx-settings-action';
import { HighFeeWarningLabel } from './app-set-fee-warning';
import { useCurrentDefaultFee } from '@store/transactions/fees.hooks';

const MinimalErrorMessageSuspense = memo((props: StackProps) => {
  const error = useTransactionError();
  const broadcastError = useTransactionBroadcastError();

  if (!error) return null;

  const getTitle = () => {
    if (error) {
      switch (error) {
        case TransactionErrorReason.Unauthorized:
          return 'Unauthorized request';
        case TransactionErrorReason.NoContract:
          return 'Contract not found';
        case TransactionErrorReason.InvalidContractAddress:
          return 'Invalid contract address';
        case TransactionErrorReason.StxTransferInsufficientFunds:
        case TransactionErrorReason.FeeInsufficientFunds:
          return 'Insufficient balance';
        case TransactionErrorReason.BroadcastError:
          return `Broadcast error: ${JSON.stringify(broadcastError)}`;
        case TransactionErrorReason.Generic:
          return 'Something went wrong';
      }
    }
    return null;
  };
  return (
    <Stack
      data-testid={TransactionsSelectors.TransactionErrorMessage}
      alignItems="center"
      bg="#FCEEED"
      p="base"
      borderRadius="12px"
      isInline
      {...props}
    >
      <Box color={color('feedback-error')} strokeWidth={2} as={FiAlertTriangle} />
      <Caption color={color('feedback-error')}>{getTitle()}</Caption>
    </Stack>
  );
});

export const MinimalErrorMessage = memo((props: StackProps) => {
  return (
    <React.Suspense fallback={<></>}>
      <MinimalErrorMessageSuspense {...props} />
    </React.Suspense>
  );
});

const BaseConfirmButton = (props: ButtonProps) => (
  <Button borderRadius="10px" py="base" width="100%" {...props}>
    Confirm
  </Button>
);

const SubmitActionSuspense = (props: ButtonProps) => {
  const handleBroadcastTransaction = useTransactionBroadcast();
  const error = useTransactionError();
  const { setIsLoading, setIsIdle, isLoading } = useLoading(LOADING_KEYS.SUBMIT_TRANSACTION);

  const isDisabled = !!error;

  const handleSubmit = useCallback(async () => {
    setIsLoading();
    await handleBroadcastTransaction();
    setIsIdle();
  }, [setIsLoading, setIsIdle, handleBroadcastTransaction]);

  return (
    <>
      <BaseConfirmButton
        data-testid={TransactionsSelectors.BtnConfirmTransaction}
        onClick={handleSubmit}
        isLoading={isLoading}
        isDisabled={isDisabled}
        {...props}
      >
        Confirm
      </BaseConfirmButton>
    </>
  );
};

const SubmitAction = (props: ButtonProps) => {
  return (
    <>
      <React.Suspense fallback={<BaseConfirmButton isLoading isDisabled {...props} />}>
        <SubmitActionSuspense {...props} />
      </React.Suspense>
      <React.Suspense fallback={<ShowTxSettingsPlaceholder />}>
        <ShowTxSettingsAction />
      </React.Suspense>
    </>
  );
};

const FeeRowItemSuspense = () => {
  let showWarning = false;
  const defaultFee = useCurrentDefaultFee();
  const transactionRequest = useTransactionRequest();
  const appName = transactionRequest?.appDetails?.name;
  const customFee = transactionRequest?.fee;

  if (!!customFee && defaultFee) {
    showWarning = customFee > defaultFee.toNumber() * 4;
  }

  return (
    <SpaceBetween>
      <Caption>
        <Flex>
          Fees
          {showWarning && <HighFeeWarningLabel appName={appName} />}
        </Flex>
      </Caption>
      <Caption>
        <FeeComponent />
      </Caption>
    </SpaceBetween>
  );
};

const FeeRowItemFallback = () => {
  return (
    <SpaceBetween>
      <Caption>Fees</Caption>
      <LoadingRectangle width="50px" height="10px" />
    </SpaceBetween>
  );
};

const FeeRowItem = () => {
  return (
    <React.Suspense fallback={<FeeRowItemFallback />}>
      <FeeRowItemSuspense />
    </React.Suspense>
  );
};

export const TransactionsActions = () => {
  return (
    <>
      <FeeRowItem />
      <SpaceBetween>
        <Caption>Network</Caption>
        <NetworkRowItem />
      </SpaceBetween>
      <MinimalErrorMessage />
      <SubmitAction />
    </>
  );
};
