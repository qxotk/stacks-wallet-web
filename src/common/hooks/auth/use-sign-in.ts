import React, { useCallback, useEffect, useRef } from 'react';
import { useWallet } from '@common/hooks/use-wallet';
import { useChangeScreen } from '@common/hooks/use-do-change-screen';
import {
  extractPhraseFromPasteEvent,
  validateAndCleanRecoveryInput,
  hasLineReturn,
} from '@common/utils';
import { ScreenPaths } from '@common/types';
import { useLoading } from '@common/hooks/use-loading';
import {
  useMagicRecoveryCodeState,
  useSeedInputErrorState,
  useSeedInputState,
} from '@store/onboarding/onboarding.hooks';

export function useSignIn() {
  const [, setMagicRecoveryCode] = useMagicRecoveryCodeState();
  const [seed, setSeed] = useSeedInputState();
  const [error, setError] = useSeedInputErrorState();

  const { isLoading, setIsLoading, setIsIdle } = useLoading('useSignIn');
  const doChangeScreen = useChangeScreen();
  const { doStoreSeed } = useWallet();

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleSetError = useCallback(
    (message = "The Secret Key you've entered is invalid") => {
      setError(message);
      setIsIdle();
      textAreaRef.current?.focus();
      return;
    },
    [setError, setIsIdle, textAreaRef]
  );

  const handleSubmit = useCallback(
    async (passedValue?: string) => {
      textAreaRef.current?.blur();
      setIsLoading();
      const parsedKeyInput = passedValue || seed.trim();

      // empty?
      if (parsedKeyInput.length === 0) {
        handleSetError('Entering your Secret Key is required.');
      }

      // recovery key?
      if (parsedKeyInput.split(' ').length <= 1) {
        const result = validateAndCleanRecoveryInput(parsedKeyInput);
        if (result.isValid) {
          setMagicRecoveryCode(parsedKeyInput);
          doChangeScreen(ScreenPaths.RECOVERY_CODE);
          return;
        } else {
          // single word and not a valid recovery key
          handleSetError();
        }
      }

      try {
        await doStoreSeed({ secretKey: parsedKeyInput });
        doChangeScreen(ScreenPaths.SET_PASSWORD);
        setIsIdle();
      } catch (error) {
        handleSetError();
      }
    },
    [
      seed,
      doStoreSeed,
      doChangeScreen,
      handleSetError,
      setIsIdle,
      setIsLoading,
      setMagicRecoveryCode,
    ]
  );

  const handleSetSeed = useCallback(
    async (value: string, trim?: boolean) => {
      const trimmed = trim ? value.trim() : value;
      const isEmpty = JSON.stringify(trimmed) === '' || trimmed === '' || !trimmed;
      if (trimmed === seed) return;
      if (isEmpty) {
        setSeed('');
        error && setError(undefined);
        return;
      }
      error && setError(undefined);
      setSeed(trimmed || '');
      if (hasLineReturn(trimmed)) {
        textAreaRef.current?.blur();
        await handleSubmit(trimmed);
      }
    },
    [error, seed, textAreaRef, handleSubmit, setSeed, setError]
  );

  const onChange = useCallback(
    async (event: React.FormEvent<HTMLInputElement>) => {
      await handleSetSeed(event.currentTarget.value);
    },
    [handleSetSeed]
  );

  const onPaste = useCallback(
    async (event: React.ClipboardEvent) => {
      const value = extractPhraseFromPasteEvent(event);
      await handleSetSeed(value, true);
      await handleSubmit(value);
    },
    [handleSetSeed, handleSubmit]
  );

  const onSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      return handleSubmit();
    },
    [handleSubmit]
  );

  const onBack = useCallback(() => doChangeScreen(ScreenPaths.HOME), [doChangeScreen]);

  const onKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  useEffect(() => {
    return () => {
      setError(undefined);
      setSeed('');
    };
  }, [setError, setSeed]);

  return {
    onBack,
    onChange,
    onPaste,
    onSubmit,
    onKeyDown,
    ref: textAreaRef,
    value: seed,
    error,
    isLoading,
  };
}
