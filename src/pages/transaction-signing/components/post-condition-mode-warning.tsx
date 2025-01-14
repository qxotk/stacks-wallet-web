import { usePostConditionModeState } from '@store/transactions/post-conditions.hooks';
import { PostConditionMode } from '@stacks/transactions';
import { Box, color, Flex, Text } from '@stacks/ui';
import { FiAlertCircle } from 'react-icons/fi';
import React from 'react';

export const PostConditionModeWarning = () => {
  const mode = usePostConditionModeState();

  if (mode !== PostConditionMode.Allow) return null;

  return (
    <Box background={color('bg-alt')} py="base" px="base-loose" borderRadius="10px">
      <Flex>
        <Box mr="base-tight" mt="2px">
          <FiAlertCircle color={color('feedback-error')} />
        </Box>
        <Box>
          <Text textStyle="body.small.medium" fontWeight={500}>
            This transaction is not secure
          </Text>
          <Text
            textStyle="body.small"
            color={color('text-caption')}
            lineHeight="22px"
            mt="extra-tight"
          >
            If you confirm, you allow it to transfer any of your tokens. Only confirm if you trust
            and have verified the contract.
          </Text>
        </Box>
      </Flex>
    </Box>
  );
};
