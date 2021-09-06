import React from 'react';
import { DecodedAuthRequest } from './dev/types';
import { wordlists } from 'bip39';
import { BufferReader, deserializePostCondition, PostCondition } from '@stacks/transactions';
import { isValidUrl } from './validation/validate-url';
import { getTab, deleteTabForRequest, StorageKey } from '@common/storage';
import {
  AuthenticationResponseMessage,
  ExternalMethods,
  MESSAGE_SOURCE,
  TransactionResponseMessage,
  TxResult,
} from '@common/message-types';

import { KEBAB_REGEX, Network } from '@common/constants';
import { StacksNetwork } from '@stacks/network';
import { fetcher } from '@common/api/wrapped-fetch';
import BigNumber from 'bignumber.js';

function kebabCase(str: string) {
  return str.replace(KEBAB_REGEX, match => '-' + match.toLowerCase());
}

export const getEventSourceWindow = (event: MessageEvent) => {
  const isWindow =
    !(event.source instanceof MessagePort) && !(event.source instanceof ServiceWorker);
  if (isWindow) {
    return event.source as Window;
  }
  return null;
};

interface FinalizeAuthParams {
  decodedAuthRequest: DecodedAuthRequest;
  authResponse: string;
  authRequest: string;
}

/**
 * Call this function at the end of onboarding.
 *
 * We fetch the ID of the tab that originated this request from a data store.
 * Then, we send a message back to that tab, which is handled by the content script
 * of the extension.
 *
 */
export const finalizeAuthResponse = ({
  decodedAuthRequest,
  authRequest,
  authResponse,
}: FinalizeAuthParams) => {
  const dangerousUri = decodedAuthRequest.redirect_uri;
  if (!isValidUrl(dangerousUri)) {
    throw new Error('Cannot proceed with malicious url');
  }
  try {
    const tabId = getTab(StorageKey.authenticationRequests, authRequest);
    const responseMessage: AuthenticationResponseMessage = {
      source: MESSAGE_SOURCE,
      payload: {
        authenticationRequest: authRequest,
        authenticationResponse: authResponse,
      },
      method: ExternalMethods.authenticationResponse,
    };
    chrome.tabs.sendMessage(tabId, responseMessage);
    deleteTabForRequest(StorageKey.authenticationRequests, authRequest);
    window.close();
  } catch (error) {
    console.debug('Failed to get Tab ID for authentication request:', authRequest);
    throw new Error(
      'Your transaction was broadcasted, but we lost communication with the app you started with.'
    );
  }
};

export const finalizeTxSignature = (requestPayload: string, data: TxResult | string) => {
  try {
    const tabId = getTab(StorageKey.transactionRequests, requestPayload);
    const responseMessage: TransactionResponseMessage = {
      source: MESSAGE_SOURCE,
      method: ExternalMethods.transactionResponse,
      payload: {
        transactionRequest: requestPayload,
        transactionResponse: data,
      },
    };
    chrome.tabs.sendMessage(tabId, responseMessage);
    deleteTabForRequest(StorageKey.transactionRequests, requestPayload);
    // If this is a string, then the transaction has been canceled
    // and the user has closed the window
    if (typeof data !== 'string') window.close();
  } catch (error) {
    console.debug('Failed to get Tab ID for transaction request:', requestPayload);
    throw new Error(
      'Your transaction was broadcasted, but we lost communication with the app you started with.'
    );
  }
};

export const getRandomWord = () => {
  const list = wordlists.EN;
  return list[Math.floor(Math.random() * list.length)];
};

export function stringToHslColor(str: string, saturation: number, lightness: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

export function extractPhraseFromString(value: string) {
  const clean = value.trim();
  const words = clean.match(/\S+/g);
  if (words?.length) {
    return words
      .map(word => (word.match(/[^0-9]+/g) ? word : null))
      .filter(Boolean)
      .join(' ');
  } else {
    return clean;
  }
}

export function extractPhraseFromPasteEvent(event: React.ClipboardEvent) {
  const pasted = event.clipboardData.getData('Text');
  return extractPhraseFromString(pasted);
}

export function validateAndCleanRecoveryInput(value: string) {
  const cleaned = value.trim();
  // Base64 encoded encrypted phrase
  let cleanedEncrypted = cleaned.replace(/\s/gm, '');
  const isPossibleRecoveryKey = /^[a-zA-Z0-9\+\/]+=?$/.test(cleanedEncrypted);

  if (isPossibleRecoveryKey && cleanedEncrypted.slice(-1) !== '=') {
    // Append possibly missing equals sign padding
    cleanedEncrypted = `${cleanedEncrypted}=`;
  }
  if (cleanedEncrypted.length >= 108) {
    return {
      isValid: true,
      value: cleanedEncrypted,
    };
  }
  return { isValid: false, value };
}

export const hasLineReturn = (input: string) => input.includes('\n');

export function makeTxExplorerLink(txid: string, chain: 'mainnet' | 'testnet') {
  return `https://explorer.stacks.co/txid/${txid}?chain=${chain}`;
}

export function truncateString(str: string, maxLength: number) {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength) + '...';
}

function getLetters(string: string, offset = 1) {
  return string.slice(0, offset);
}

export function getTicker(value: string) {
  let name = kebabCase(value);
  if (name.includes('-')) {
    const words = name.split('-');
    if (words.length >= 3) {
      name = `${getLetters(words[0])}${getLetters(words[1])}${getLetters(words[2])}`;
    } else {
      name = `${getLetters(words[0])}${getLetters(words[1], 2)}`;
    }
  } else if (name.length >= 3) {
    name = `${getLetters(name, 3)}`;
  }
  return name.toUpperCase();
}

export function postConditionFromString(postCondition: string): PostCondition {
  const reader = BufferReader.fromBuffer(Buffer.from(postCondition, 'hex'));
  return deserializePostCondition(reader);
}

export function isUtf8(buf?: Buffer | Uint8Array): boolean {
  if (!buf) {
    return false;
  }
  let i = 0;
  const len = buf.length;
  while (i < len) {
    // UTF8-1 = %x00-7F
    if (buf[i] <= 0x7f) {
      i++;
      continue;
    }
    // UTF8-2 = %xC2-DF UTF8-tail
    if (buf[i] >= 0xc2 && buf[i] <= 0xdf) {
      // if(buf[i + 1] >= 0x80 && buf[i + 1] <= 0xBF) {
      if (buf[i + 1] >> 6 === 2) {
        i += 2;

        continue;
      } else {
        return false;
      }
    }
    // UTF8-3 = %xE0 %xA0-BF UTF8-tail
    // UTF8-3 = %xED %x80-9F UTF8-tail
    if (
      ((buf[i] === 0xe0 && buf[i + 1] >= 0xa0 && buf[i + 1] <= 0xbf) ||
        (buf[i] === 0xed && buf[i + 1] >= 0x80 && buf[i + 1] <= 0x9f)) &&
      buf[i + 2] >> 6 === 2
    ) {
      i += 3;
      continue;
    }
    // UTF8-3 = %xE1-EC 2( UTF8-tail )
    // UTF8-3 = %xEE-EF 2( UTF8-tail )
    if (
      ((buf[i] >= 0xe1 && buf[i] <= 0xec) || (buf[i] >= 0xee && buf[i] <= 0xef)) &&
      buf[i + 1] >> 6 === 2 &&
      buf[i + 2] >> 6 === 2
    ) {
      i += 3;

      continue;
    }
    // UTF8-4 = %xF0 %x90-BF 2( UTF8-tail )
    //          %xF1-F3 3( UTF8-tail )
    //          %xF4 %x80-8F 2( UTF8-tail )
    if (
      ((buf[i] === 0xf0 && buf[i + 1] >= 0x90 && buf[i + 1] <= 0xbf) ||
        (buf[i] >= 0xf1 && buf[i] <= 0xf3 && buf[i + 1] >> 6 === 2) ||
        (buf[i] === 0xf4 && buf[i + 1] >= 0x80 && buf[i + 1] <= 0x8f)) &&
      buf[i + 2] >> 6 === 2 &&
      buf[i + 3] >> 6 === 2
    ) {
      i += 4;
      continue;
    }
    return false;
  }
  return true;
}

export const abbreviateNumber = (n: number) => {
  if (n < 1e3) return n.toString();
  if (n >= 1e3 && n < 1e6) return +(n / 1e3).toFixed(2) + 'K';
  if (n >= 1e6 && n < 1e9) return +(n / 1e6).toFixed(2) + 'M';
  if (n >= 1e9 && n < 1e12) return +(n / 1e9).toFixed(2) + 'B';
  if (n >= 1e12) return +(n / 1e12).toFixed(2) + 'T';
  return n.toString();
};

export function isHex(hex: string): boolean {
  const regexp = /^[0-9a-fA-F]+$/;
  return regexp.test(hex);
}

export function hexToHumanReadable(hex: string) {
  if (!isHex(hex)) return hex;
  const buff = Buffer.from(hex, 'hex');
  if (isUtf8(buff)) return buff.toString('utf8');
  return `0x${hex}`;
}

// We need this function because the latest changes
// to `@stacks/network` had some undesired consequence.
// As `StacksNetwork` is a class instance, this is auto
// serialized when being passed across `postMessage`,
// from the developer's app, to the Hiro Wallet.
// `coreApiUrl` now uses a getter, rather than a prop,
// and `_coreApiUrl` is a private value.
// To support both `@stacks/network` versions a dev may be using
// we look for both possible networks defined
function getCoreApiUrl(network: StacksNetwork) {
  if ((network as any).coreApiUrl) return (network as any).coreApiUrl;
  if ((network as any)._coreApiUrl) return (network as any)._coreApiUrl;
}

export function findMatchingNetworkKey(
  txNetwork: StacksNetwork,
  networks: Record<string, Network>
) {
  if (!networks || !txNetwork) return;

  const developerDefinedApiUrl = getCoreApiUrl(txNetwork);

  const keys = Object.keys(networks);

  // first try to search for an _exact_ url match
  const exactUrlMatch = keys.find((key: string) => {
    const network = networks[key] as Network;
    return network.url === developerDefinedApiUrl;
  });
  if (exactUrlMatch) return exactUrlMatch;

  // else check for a matching chain id (testnet/mainnet)
  const chainIdMatch = keys.find((key: string) => {
    const network = networks[key] as Network;
    return network.url === developerDefinedApiUrl || network.chainId === txNetwork?.chainId;
  });
  if (chainIdMatch) return chainIdMatch;

  return null;
}

export function cleanUsername(username: string) {
  return username?.split('.')[0];
}

export const slugify = (...args: (string | number)[]): string => {
  const value = args.join(' ');

  return value
    .normalize('NFD') // split an accented letter in the base letter and the accent
    .replace(/[\u0300-\u036f]/g, '') // remove all previously split accents
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9 ]/g, '') // remove all chars not letters, numbers and spaces (to be replaced)
    .replace(/\s+/g, '-'); // separator
};

export function getUrlHostname(url: string) {
  return new URL(url).hostname;
}

export function getUrlPort(url: string) {
  return new URL(url).port;
}

export async function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithTimeout(
  input: RequestInfo,
  init: RequestInit & { timeout?: number } = {}
) {
  const { timeout = 8000, ...options } = init;

  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  const response = await fetcher(input, {
    ...options,
    signal: controller.signal,
  });
  clearTimeout(id);

  return response;
}

export function with0x(value: string): string {
  return !value.startsWith('0x') ? `0x${value}` : value;
}

export function initBigNumber(num: string | number | BigNumber) {
  return BigNumber.isBigNumber(num) ? num : new BigNumber(num);
}

export function countDecimals(num: string | number | BigNumber) {
  const LARGE_NUMBER_OF_DECIMALS = 100;
  BigNumber.config({ DECIMAL_PLACES: LARGE_NUMBER_OF_DECIMALS });
  const amount = initBigNumber(num);
  const decimals = amount.toString(10).split('.')[1];
  return decimals ? decimals.length : 0;
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number';
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}
