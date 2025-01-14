import { AddressTokenOfferingLocked } from '@stacks/stacks-blockchain-api-types/generated';
import BigNumber from 'bignumber.js';

type SelectedKeys =
  | 'balance'
  | 'total_sent'
  | 'total_received'
  | 'total_fees_sent'
  | 'total_miner_rewards_received'
  | 'locked';

export type AccountBalanceStxKeys = keyof Pick<AddressBalanceResponse['stx'], SelectedKeys>;

export interface AddressBalanceResponse {
  stx: {
    balance: string;
    total_sent: string;
    total_received: string;
    total_fees_sent: string;
    total_miner_rewards_received: string;
    lock_tx_id: string;
    locked: string;
    lock_height: number;
    burnchain_lock_height: number;
    burnchain_unlock_height: number;
  };
  fungible_tokens: Record<
    string,
    {
      balance: string;
      total_sent: string;
      total_received: string;
    }
  >;
  non_fungible_tokens: Record<
    string,
    {
      count: string;
      total_sent: string;
      total_received: string;
    }
  >;
  token_offering_locked?: AddressTokenOfferingLocked;
}

export interface AccountStxBalanceBigNumber
  extends Omit<AddressBalanceResponse['stx'], AccountBalanceStxKeys> {
  balance: BigNumber;
  total_sent: BigNumber;
  total_received: BigNumber;
  total_fees_sent: BigNumber;
  total_miner_rewards_received: BigNumber;
  locked: BigNumber;
}

export interface AccountBalanceResponseBigNumber extends Omit<AddressBalanceResponse, 'stx'> {
  stx: AccountStxBalanceBigNumber;
}
