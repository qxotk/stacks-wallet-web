import { useLoading } from '@common/hooks/use-loading';
import { useWallet } from '@common/hooks/use-wallet';
import React, { useCallback, useEffect, useState } from 'react';
import { useOnboardingState } from '@common/hooks/auth/use-onboarding-state';
import { useChangeScreen } from '@common/hooks/use-do-change-screen';
import { USERNAMES_ENABLED } from '@common/constants';
import { ScreenPaths } from '@common/types';
import { decrypt } from '@stacks/wallet-sdk';
import {
  useMagicRecoveryCodePasswordState,
  useMagicRecoveryCodeState,
} from '@store/onboarding/onboarding.hooks';

export function useMagicRecoveryCode() {
  const [magicRecoveryCode, setMagicRecoveryCode] = useMagicRecoveryCodeState();
  const [password, setPassword] = useMagicRecoveryCodePasswordState();
  const { isLoading, setIsLoading, setIsIdle } = useLoading('useMagicRecoveryCode');
  const { doStoreSeed, doSetPassword, doFinishSignIn } = useWallet();
  const [error, setPasswordError] = useState('');
  const { decodedAuthRequest } = useOnboardingState();
  const doChangeScreen = useChangeScreen();

  const handleNavigate = useCallback(() => {
    if (decodedAuthRequest) {
      if (!USERNAMES_ENABLED) {
        setTimeout(() => {
          void doFinishSignIn(0);
        }, 1000);
      } else {
        doChangeScreen(ScreenPaths.USERNAME);
      }
    } else {
      doChangeScreen(ScreenPaths.HOME);
    }
  }, [doChangeScreen, decodedAuthRequest, doFinishSignIn]);

  const handleSubmit = useCallback(async () => {
    if (!magicRecoveryCode) throw Error('No magic recovery seed');
    setIsLoading();
    try {
      const codeBuffer = Buffer.from(magicRecoveryCode, 'base64');
      const secretKey = await decrypt(codeBuffer, password);
      await doStoreSeed({ secretKey });
      await doSetPassword(password);
      handleNavigate();
    } catch (error) {
      setPasswordError(`Incorrect password, try again.`);
      setIsIdle();
    }
  }, [
    doSetPassword,
    setIsIdle,
    setIsLoading,
    magicRecoveryCode,
    password,
    doStoreSeed,
    handleNavigate,
  ]);

  const onChange = useCallback(
    (event: React.FormEvent<HTMLInputElement>) => {
      event.preventDefault();
      setPassword(event.currentTarget.value);
    },
    [setPassword]
  );

  const handleBack = () => doChangeScreen(ScreenPaths.SIGN_IN);

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      await handleSubmit();
    },
    [handleSubmit]
  );

  useEffect(() => {
    return () => {
      setMagicRecoveryCode('');
      setPassword('');
    };
  }, [setMagicRecoveryCode, setPassword]);

  return {
    isLoading,
    onBack: handleBack,
    onSubmit,
    onChange,
    password,
    error,
  };
}
